/*
  Warnings:

  - The values [TEXT,IMAGE,FILE,SYSTEM] on the enum `MessageType` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `messages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `deleted_at` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `reply_to_message_id` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `message_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the `conversation_participants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message_attachments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message_reads` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sender_name` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Made the column `content` on table `messages` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MessageType_new" AS ENUM ('text', 'image', 'file', 'video', 'system');
ALTER TABLE "public"."messages" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "messages" ALTER COLUMN "type" TYPE "MessageType_new"
USING (lower("type"::text)::"MessageType_new");
ALTER TYPE "MessageType" RENAME TO "MessageType_old";
ALTER TYPE "MessageType_new" RENAME TO "MessageType";
DROP TYPE "public"."MessageType_old";
ALTER TABLE "messages" ALTER COLUMN "type" SET DEFAULT 'text';
COMMIT;

-- DropForeignKey
ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_last_read_message_id_fkey";

-- DropForeignKey
ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_user_id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_created_by_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_last_message_id_fkey";

-- DropForeignKey
ALTER TABLE "message_attachments" DROP CONSTRAINT "message_attachments_message_id_fkey";

-- DropForeignKey
ALTER TABLE "message_attachments" DROP CONSTRAINT "message_attachments_upload_id_fkey";

-- DropForeignKey
ALTER TABLE "message_reads" DROP CONSTRAINT "message_reads_message_id_fkey";

-- DropForeignKey
ALTER TABLE "message_reads" DROP CONSTRAINT "message_reads_user_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_reply_to_message_id_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_message_id_fkey";

-- DropIndex
DROP INDEX "messages_conversation_id_idx";

-- Older databases used users.full_name. Normalize it before reading sender names.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'full_name'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'name'
    ) THEN
        ALTER TABLE "users" RENAME COLUMN "full_name" TO "name";
    END IF;
END
$$;
ALTER TABLE "users" ALTER COLUMN "name" TYPE VARCHAR(60);

-- Backfill the required sender name before changing sender IDs to text.
ALTER TABLE "messages" ADD COLUMN "sender_name" TEXT;
UPDATE "messages" AS m
SET "sender_name" = COALESCE(u."name", 'Unknown')
FROM "users" AS u
WHERE m."sender_id" = u."id";
UPDATE "messages"
SET "sender_name" = 'System'
WHERE "sender_name" IS NULL;

-- AlterTable
ALTER TABLE "messages" DROP CONSTRAINT "messages_pkey",
DROP COLUMN "deleted_at",
DROP COLUMN "reply_to_message_id",
DROP COLUMN "status",
DROP COLUMN "updated_at",
ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "edited_at" TIMESTAMP(3),
ADD COLUMN     "reply_to_id" TEXT,
ALTER COLUMN "sender_name" SET NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT USING "id"::TEXT,
ALTER COLUMN "conversation_id" SET DATA TYPE TEXT USING "conversation_id"::TEXT,
ALTER COLUMN "sender_id" SET DATA TYPE TEXT USING "sender_id"::TEXT,
ALTER COLUMN "type" SET DEFAULT 'text',
ALTER COLUMN "content" SET NOT NULL,
ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "messages_id_seq";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "message_id";

-- DropTable
DROP TABLE "conversation_participants";

-- DropTable
DROP TABLE "conversations";

-- DropTable
DROP TABLE "message_attachments";

-- DropTable
DROP TABLE "message_reads";

-- DropEnum
DROP TYPE "ConversationType";

-- DropEnum
DROP TYPE "MessageStatus";

-- CreateTable
CREATE TABLE "message_reactions" (
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("message_id","user_id")
);

-- CreateIndex
CREATE INDEX "message_reactions_message_id_idx" ON "message_reactions"("message_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
