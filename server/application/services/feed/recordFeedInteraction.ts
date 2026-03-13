import type { Prisma, FeedEventType } from "@prisma/client";

interface RecordFeedInteractionInput {
  tx: Prisma.TransactionClient;
  userId: number;
  eventType: FeedEventType;
  postId?: number | null;
  commentId?: number | null;
  targetUserId?: number | null;
  value?: number | null;
  metadata?: Prisma.InputJsonValue;
}

export async function recordFeedInteraction({
  tx,
  userId,
  eventType,
  postId,
  commentId,
  targetUserId,
  value,
  metadata,
}: RecordFeedInteractionInput): Promise<void> {
  await tx.feedInteraction.create({
    data: {
      userId,
      eventType,
      postId: postId ?? null,
      commentId: commentId ?? null,
      targetUserId: targetUserId ?? null,
      value: value ?? null,
      metadata: metadata ?? undefined,
    },
  });
}