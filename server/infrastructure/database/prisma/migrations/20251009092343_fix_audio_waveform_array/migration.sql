-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "audioDurationSec" INTEGER,
ADD COLUMN     "audioMime" TEXT,
ADD COLUMN     "audioOriginalUrl" TEXT,
ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "audioWaveform" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "processingStatus" "ProcessingStatus";

-- CreateIndex
CREATE INDEX "Message_processingStatus_createdAt_idx" ON "Message"("processingStatus", "createdAt");
