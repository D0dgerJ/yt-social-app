import type { Prisma } from "@prisma/client";

interface SyncAutoRulePostTagsInput {
  tx: Prisma.TransactionClient;
  postId: number;
  autoTags: string[];
}

export async function syncAutoRulePostTags({
  tx,
  postId,
  autoTags,
}: SyncAutoRulePostTagsInput): Promise<void> {
  await tx.postTag.deleteMany({
    where: {
      postId,
      source: "AUTO_RULE",
    },
  });

  if (autoTags.length === 0) return;

  const tagRecords = await Promise.all(
    autoTags.map((slug) =>
      tx.tag.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          label: slug,
        },
      })
    )
  );

  await tx.postTag.createMany({
    data: tagRecords.map((tag) => ({
      postId,
      tagId: tag.id,
      source: "AUTO_RULE" as const,
      confidence: 0.7,
      weight: 1,
      isPrimary: false,
    })),
    skipDuplicates: true,
  });
}