-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "files" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "videos" TEXT[] DEFAULT ARRAY[]::TEXT[];
