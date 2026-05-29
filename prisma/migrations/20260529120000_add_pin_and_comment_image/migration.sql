-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "pinned_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "image_url" TEXT;
