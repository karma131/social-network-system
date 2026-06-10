-- CreateEnum
CREATE TYPE "FriendStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- CreateTable
CREATE TABLE "friends" (
    "requester_id" BIGINT NOT NULL,
    "addressee_id" BIGINT NOT NULL,
    "status" "FriendStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friends_pkey" PRIMARY KEY ("requester_id","addressee_id")
);

-- CreateIndex
CREATE INDEX "friends_addressee_id_idx" ON "friends"("addressee_id");

-- CreateIndex
CREATE INDEX "friends_status_idx" ON "friends"("status");

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
