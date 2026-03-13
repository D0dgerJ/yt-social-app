import type { Prisma, FeedEventType } from "@prisma/client";

interface ApplyFeedInterestSignalInput {
  tx: Prisma.TransactionClient;
  userId: number;
  postId: number;
  authorId: number;
  eventType: FeedEventType;
}

const EVENT_WEIGHTS: Record<
  FeedEventType,
  { tagDelta: number; authorDelta: number } | undefined
> = {
  POST_IMPRESSION: undefined,
  POST_OPEN: undefined,
  POST_DWELL: undefined,
  POST_LIKE: { tagDelta: 3, authorDelta: 2 },
  POST_UNLIKE: { tagDelta: -2, authorDelta: -1 },
  POST_SAVE: { tagDelta: 4, authorDelta: 3 },
  POST_UNSAVE: { tagDelta: -3, authorDelta: -2 },
  POST_HIDE: undefined,
  POST_REPORT: undefined,
  COMMENT_OPEN: undefined,
  COMMENT_CREATE: { tagDelta: 5, authorDelta: 3 },
  COMMENT_REPLY: { tagDelta: 5, authorDelta: 3 },
  COMMENT_LIKE: { tagDelta: 1.5, authorDelta: 1 },
  COMMENT_UNLIKE: { tagDelta: -1, authorDelta: -0.5 },
};

export async function applyFeedInterestSignal({
  tx,
  userId,
  postId,
  authorId,
  eventType,
}: ApplyFeedInterestSignalInput): Promise<void> {
  const weights = EVENT_WEIGHTS[eventType];
  if (!weights) return;

  const now = new Date();

  const postTags = await tx.postTag.findMany({
    where: { postId },
    select: {
      tagId: true,
      weight: true,
      confidence: true,
    },
  });

  for (const postTag of postTags) {
    const confidence = postTag.confidence ?? 1;
    const delta = weights.tagDelta * postTag.weight * confidence;

    await tx.userTagInterest.upsert({
      where: {
        userId_tagId: {
          userId,
          tagId: postTag.tagId,
        },
      },
      update: {
        score: { increment: delta },
        positiveScore: { increment: delta > 0 ? delta : 0 },
        negativeScore: { increment: delta < 0 ? Math.abs(delta) : 0 },
        lastInteractedAt: now,
      },
      create: {
        userId,
        tagId: postTag.tagId,
        score: delta,
        positiveScore: delta > 0 ? delta : 0,
        negativeScore: delta < 0 ? Math.abs(delta) : 0,
        lastInteractedAt: now,
      },
    });
  }

  if (authorId !== userId) {
    await tx.userAuthorInterest.upsert({
      where: {
        userId_authorId: {
          userId,
          authorId,
        },
      },
      update: {
        score: { increment: weights.authorDelta },
        lastInteractedAt: now,
      },
      create: {
        userId,
        authorId,
        score: weights.authorDelta,
        lastInteractedAt: now,
      },
    });
  }
}