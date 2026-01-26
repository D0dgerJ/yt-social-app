-- DropForeignKey
ALTER TABLE "PostReport" DROP CONSTRAINT "PostReport_postId_fkey";

-- DropForeignKey
ALTER TABLE "PostReport" DROP CONSTRAINT "PostReport_reporterId_fkey";

-- AlterTable
ALTER TABLE "PostReport" ALTER COLUMN "postId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
