-- AlterTable
ALTER TABLE "ModerationAction" ADD COLUMN     "subjectUserId" INTEGER;

-- CreateIndex
CREATE INDEX "ModerationAction_subjectUserId_createdAt_idx" ON "ModerationAction"("subjectUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAction_actionType_createdAt_idx" ON "ModerationAction"("actionType", "createdAt");

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
