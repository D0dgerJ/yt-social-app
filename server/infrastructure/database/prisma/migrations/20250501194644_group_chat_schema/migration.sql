/*
  Warnings:

  - You are about to drop the column `userOneId` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `userTwoId` on the `Conversation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "userOneId",
DROP COLUMN "userTwoId",
ADD COLUMN     "isGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "content" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Participant" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_userId_conversationId_key" ON "Participant"("userId", "conversationId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
