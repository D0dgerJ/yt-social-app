-- CreateIndex
CREATE INDEX "Notification_toUserId_isRead_createdAt_idx" ON "Notification"("toUserId", "isRead", "createdAt");
