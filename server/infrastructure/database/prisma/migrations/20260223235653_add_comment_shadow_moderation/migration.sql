-- CreateEnum
CREATE TYPE "CommentVisibility" AS ENUM ('PUBLIC', 'SHADOW_HIDDEN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ModerationActionType" ADD VALUE 'CONTENT_SHADOW_HIDDEN';
ALTER TYPE "ModerationActionType" ADD VALUE 'CONTENT_SHADOW_UNHIDDEN';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "shadowHiddenAt" TIMESTAMP(3),
ADD COLUMN     "shadowHiddenById" INTEGER,
ADD COLUMN     "shadowHiddenReason" TEXT,
ADD COLUMN     "visibility" "CommentVisibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateIndex
CREATE INDEX "Comment_visibility_idx" ON "Comment"("visibility");

-- CreateIndex
CREATE INDEX "Comment_postId_visibility_idx" ON "Comment"("postId", "visibility");

-- CreateIndex
CREATE INDEX "Comment_parentId_status_idx" ON "Comment"("parentId", "status");

-- CreateIndex
CREATE INDEX "Comment_parentId_visibility_idx" ON "Comment"("parentId", "visibility");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_shadowHiddenById_fkey" FOREIGN KEY ("shadowHiddenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
