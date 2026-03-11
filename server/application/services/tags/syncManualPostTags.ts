import type { Prisma } from "@prisma/client";

interface SyncManualPostTagsInput {
  tx: Prisma.TransactionClient;
  postId: number;
  normalizedTags: string[];
}

export async function syncManualPostTags({
  tx,
  postId,
  normalizedTags,
}: SyncManualPostTagsInput): Promise<void> {
  await tx.postTag.deleteMany({
    where: {
      postId,
      source: "MANUAL",
    },
  });

  if (normalizedTags.length === 0) return;

  const tagRecords = await Promise.all(
    normalizedTags.map((slug) =>
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
    data: tagRecords.map((tag, index) => ({
      postId,
      tagId: tag.id,
      source: "MANUAL" as const,
      confidence: 1,
      weight: 1,
      isPrimary: index === 0,
    })),
    skipDuplicates: true,
  });
}