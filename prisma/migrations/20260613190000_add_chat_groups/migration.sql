CREATE TABLE "chat_groups" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_by" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_group_members" (
    "group_id" TEXT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_group_members_pkey" PRIMARY KEY ("group_id","user_id")
);

CREATE INDEX "chat_groups_created_by_idx" ON "chat_groups"("created_by");
CREATE INDEX "chat_group_members_user_id_idx" ON "chat_group_members"("user_id");

ALTER TABLE "chat_groups"
ADD CONSTRAINT "chat_groups_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_group_members"
ADD CONSTRAINT "chat_group_members_group_id_fkey"
FOREIGN KEY ("group_id") REFERENCES "chat_groups"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_group_members"
ADD CONSTRAINT "chat_group_members_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
