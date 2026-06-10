// Prod-safe seed (no ts-node). Uses only runtime deps (@prisma/client, bcrypt)
// so it runs in a Render build even when NODE_ENV=production drops devDeps.
// Idempotent (upsert by email) — safe to run on every deploy.
const { PrismaClient, UserRole, UserStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'adminadmin';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'Admin';

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    select: { id: true, email: true, role: true },
  });
  console.log(
    `Seeded admin: id=${admin.id.toString()} email=${admin.email} role=${admin.role}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
