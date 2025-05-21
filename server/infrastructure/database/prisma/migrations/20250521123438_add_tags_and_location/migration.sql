-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "location" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
