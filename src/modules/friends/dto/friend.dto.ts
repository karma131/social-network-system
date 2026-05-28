// Friends wire DTOs — must stay byte-aligned with the FE
// (project_III src/feature/friends/dto/friends.api.dto.ts) and the
// social-platform-be friend.model.ts shape.

export type RelStatus = 'none' | 'requested' | 'incoming' | 'friends';

export interface FriendPerson {
  id: string;
  name: string;
  email: string;
  // ISO string over the wire (Date is JSON-serialized).
  createdAt: Date;
  avatarUrl: string;
}

export interface FriendsSnapshot {
  friends: FriendPerson[];
  incoming: FriendPerson[];
  outgoing: FriendPerson[];
}
