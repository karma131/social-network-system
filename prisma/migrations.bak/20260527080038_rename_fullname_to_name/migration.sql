-- AlterTable
ALTER TABLE "users" RENAME COLUMN "full_name" TO "name";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "name" TYPE VARCHAR(60);
