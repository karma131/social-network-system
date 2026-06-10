import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Friend, FriendStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  FriendPerson,
  FriendsSnapshot,
  RelStatus,
} from './dto/friend.dto';

// User row shape we read for every person in a friend list.
type PersonRow = {
  id: bigint;
  name: string;
  email: string;
  createdAt: Date;
  avatarUrl: string | null;
};

const PERSON_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  avatarUrl: true,
} as const;

function toPerson(u: PersonRow): FriendPerson {
  return {
    id: u.id.toString(),
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    avatarUrl: u.avatarUrl ?? '',
  };
}

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  // The one row between a and b, whichever direction it was created.
  private findPair(a: bigint, b: bigint): Promise<Friend | null> {
    return this.prisma.friend.findFirst({
      where: {
        OR: [
          { requesterId: a, addresseeId: b },
          { requesterId: b, addresseeId: a },
        ],
      },
    });
  }

  // Reject self-targeting and unknown users before any write.
  private async assertOtherUser(meId: bigint, otherId: bigint): Promise<void> {
    if (meId === otherId) {
      throw new BadRequestException('Cannot friend yourself');
    }
    const exists = await this.prisma.user.findFirst({
      where: { id: otherId, deletedAt: null },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('User not found');
    }
  }

  private relStatusOf(viewerId: bigint, row: Friend | null): RelStatus {
    if (!row) return 'none';
    if (row.status === ('ACCEPTED' as FriendStatus)) return 'friends';
    return row.requesterId === viewerId ? 'requested' : 'incoming';
  }

  // Viewer-relative relationship to one user.
  async getStatus(meIdStr: string, otherIdStr: string): Promise<RelStatus> {
    const meId = BigInt(meIdStr);
    const otherId = BigInt(otherIdStr);
    if (meId === otherId) return 'none';
    const row = await this.findPair(meId, otherId);
    return this.relStatusOf(meId, row);
  }

  // Everything the friends page needs in one call.
  async snapshot(meIdStr: string): Promise<FriendsSnapshot> {
    const meId = BigInt(meIdStr);
    const [friends, incoming, outgoing] = await Promise.all([
      this.listFriends(meId),
      this.listIncoming(meId),
      this.listOutgoing(meId),
    ]);
    return { friends, incoming, outgoing };
  }

  async sendRequest(meIdStr: string, otherIdStr: string): Promise<void> {
    const meId = BigInt(meIdStr);
    const otherId = BigInt(otherIdStr);
    await this.assertOtherUser(meId, otherId);
    const existing = await this.findPair(meId, otherId);
    if (existing) {
      if (existing.status === ('ACCEPTED' as FriendStatus)) {
        throw new ConflictException('Already friends');
      }
      if (existing.requesterId === meId) {
        throw new ConflictException('Request already sent');
      }
      // They already requested me — accept rather than stack a mirror row
      // (keeps the (A,B)/(B,A) single-row invariant).
      await this.prisma.friend.update({
        where: {
          requesterId_addresseeId: {
            requesterId: existing.requesterId,
            addresseeId: existing.addresseeId,
          },
        },
        data: { status: 'ACCEPTED' },
      });
      return;
    }
    await this.prisma.friend.create({
      data: { requesterId: meId, addresseeId: otherId },
    });
  }

  async cancelRequest(meIdStr: string, otherIdStr: string): Promise<void> {
    const meId = BigInt(meIdStr);
    const otherId = BigInt(otherIdStr);
    const row = await this.findPair(meId, otherId);
    if (
      !row ||
      row.status !== ('PENDING' as FriendStatus) ||
      row.requesterId !== meId
    ) {
      throw new NotFoundException('No outgoing request to cancel');
    }
    await this.prisma.friend.delete({
      where: {
        requesterId_addresseeId: {
          requesterId: row.requesterId,
          addresseeId: row.addresseeId,
        },
      },
    });
  }

  async acceptRequest(meIdStr: string, otherIdStr: string): Promise<void> {
    const meId = BigInt(meIdStr);
    const otherId = BigInt(otherIdStr);
    const row = await this.findPair(meId, otherId);
    if (
      !row ||
      row.status !== ('PENDING' as FriendStatus) ||
      row.addresseeId !== meId
    ) {
      throw new NotFoundException('No incoming request to accept');
    }
    await this.prisma.friend.update({
      where: {
        requesterId_addresseeId: {
          requesterId: row.requesterId,
          addresseeId: row.addresseeId,
        },
      },
      data: { status: 'ACCEPTED' },
    });
  }

  async rejectRequest(meIdStr: string, otherIdStr: string): Promise<void> {
    const meId = BigInt(meIdStr);
    const otherId = BigInt(otherIdStr);
    const row = await this.findPair(meId, otherId);
    if (
      !row ||
      row.status !== ('PENDING' as FriendStatus) ||
      row.addresseeId !== meId
    ) {
      throw new NotFoundException('No incoming request to reject');
    }
    await this.prisma.friend.delete({
      where: {
        requesterId_addresseeId: {
          requesterId: row.requesterId,
          addresseeId: row.addresseeId,
        },
      },
    });
  }

  async unfriend(meIdStr: string, otherIdStr: string): Promise<void> {
    const meId = BigInt(meIdStr);
    const otherId = BigInt(otherIdStr);
    const row = await this.findPair(meId, otherId);
    if (!row || row.status !== ('ACCEPTED' as FriendStatus)) {
      throw new NotFoundException('Not friends');
    }
    await this.prisma.friend.delete({
      where: {
        requesterId_addresseeId: {
          requesterId: row.requesterId,
          addresseeId: row.addresseeId,
        },
      },
    });
  }

  // ACCEPTED rows touching userId on either side → the friend people.
  private async listFriends(userId: bigint): Promise<FriendPerson[]> {
    const rows = await this.prisma.friend.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: {
        requester: { select: PERSON_SELECT },
        addressee: { select: PERSON_SELECT },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) =>
      toPerson(r.requester.id === userId ? r.addressee : r.requester),
    );
  }

  // PENDING rows where userId is the addressee → people who asked me.
  private async listIncoming(userId: bigint): Promise<FriendPerson[]> {
    const rows = await this.prisma.friend.findMany({
      where: { status: 'PENDING', addresseeId: userId },
      select: { requester: { select: PERSON_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => toPerson(r.requester));
  }

  // PENDING rows where userId is the requester → people I asked.
  private async listOutgoing(userId: bigint): Promise<FriendPerson[]> {
    const rows = await this.prisma.friend.findMany({
      where: { status: 'PENDING', requesterId: userId },
      select: { addressee: { select: PERSON_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => toPerson(r.addressee));
  }
}
