type UserRecord = {
  id: bigint;
  name: string;
  email?: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  role?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
};

export function mapPrivateUser(user: UserRecord) {
  return {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    bio: user.bio,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function mapPublicUser(user: UserRecord) {
  return {
    id: user.id.toString(),
    name: user.name,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    bio: user.bio,
  };
}
