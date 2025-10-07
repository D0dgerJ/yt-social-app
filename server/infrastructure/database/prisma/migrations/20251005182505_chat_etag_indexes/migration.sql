-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_editedAt_idx" ON "Message"("conversationId", "editedAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_deletedAt_idx" ON "Message"("conversationId", "deletedAt");

-- CreateIndex
CREATE INDEX "Reaction_messageId_createdAt_idx" ON "Reaction"("messageId", "createdAt");
