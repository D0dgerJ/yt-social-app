-- CreateEnum
CREATE TYPE "FeedEventType" AS ENUM ('POST_IMPRESSION', 'POST_OPEN', 'POST_DWELL', 'POST_LIKE', 'POST_UNLIKE', 'POST_SAVE', 'POST_UNSAVE', 'POST_HIDE', 'POST_REPORT', 'COMMENT_OPEN', 'COMMENT_CREATE', 'COMMENT_REPLY', 'COMMENT_LIKE', 'COMMENT_UNLIKE');

-- CreateTable
CREATE TABLE "FeedInteraction" (
    "id" BIGSERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "postId" INTEGER,
    "commentId" INTEGER,
    "targetUserId" INTEGER,
    "eventType" "FeedEventType" NOT NULL,
    "value" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTagInterest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positiveScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "negativeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastInteractedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTagInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAuthorInterest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastInteractedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAuthorInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedInteraction_userId_createdAt_idx" ON "FeedInteraction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedInteraction_userId_eventType_createdAt_idx" ON "FeedInteraction"("userId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "FeedInteraction_postId_eventType_createdAt_idx" ON "FeedInteraction"("postId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "FeedInteraction_commentId_eventType_createdAt_idx" ON "FeedInteraction"("commentId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "UserTagInterest_userId_score_idx" ON "UserTagInterest"("userId", "score");

-- CreateIndex
CREATE INDEX "UserTagInterest_tagId_score_idx" ON "UserTagInterest"("tagId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "UserTagInterest_userId_tagId_key" ON "UserTagInterest"("userId", "tagId");

-- CreateIndex
CREATE INDEX "UserAuthorInterest_userId_score_idx" ON "UserAuthorInterest"("userId", "score");

-- CreateIndex
CREATE INDEX "UserAuthorInterest_authorId_score_idx" ON "UserAuthorInterest"("authorId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "UserAuthorInterest_userId_authorId_key" ON "UserAuthorInterest"("userId", "authorId");

-- AddForeignKey
ALTER TABLE "FeedInteraction" ADD CONSTRAINT "FeedInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedInteraction" ADD CONSTRAINT "FeedInteraction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedInteraction" ADD CONSTRAINT "FeedInteraction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTagInterest" ADD CONSTRAINT "UserTagInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTagInterest" ADD CONSTRAINT "UserTagInterest_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAuthorInterest" ADD CONSTRAINT "UserAuthorInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAuthorInterest" ADD CONSTRAINT "UserAuthorInterest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
