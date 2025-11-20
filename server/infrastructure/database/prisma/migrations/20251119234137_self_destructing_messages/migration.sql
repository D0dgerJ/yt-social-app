-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "isEphemeral" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxViewsPerUser" INTEGER;

-- CreateTable
CREATE TABLE "MessageView" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),

    CONSTRAINT "MessageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageView_messageId_userId_key" ON "MessageView"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "MessageView" ADD CONSTRAINT "MessageView_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageView" ADD CONSTRAINT "MessageView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
