-- CreateEnum
CREATE TYPE "ModerationTargetType" AS ENUM ('POST', 'COMMENT', 'STORY', 'USER', 'MESSAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('REPORT_CREATED', 'CONTENT_HIDDEN', 'CONTENT_UNHIDDEN', 'CONTENT_DELETED', 'USER_RESTRICTED', 'USER_UNRESTRICTED', 'USER_BANNED', 'USER_UNBANNED', 'NOTE', 'BOT_AUTO_ACTION');

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" SERIAL NOT NULL,
    "actorId" INTEGER,
    "actionType" "ModerationActionType" NOT NULL,
    "targetType" "ModerationTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModerationAction_actorId_idx" ON "ModerationAction"("actorId");

-- CreateIndex
CREATE INDEX "ModerationAction_targetType_targetId_idx" ON "ModerationAction"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "ModerationAction_createdAt_idx" ON "ModerationAction"("createdAt");

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
