import type { Prisma } from "@prisma/client";

interface ResolveTagAliasesInput {
  tx: Prisma.TransactionClient;
  tags: string[];
}

export async function resolveTagAliases({
  tx,
  tags,
}: ResolveTagAliasesInput): Promise<string[]> {
  if (tags.length === 0) return [];

  const normalizedInput = tags
    .map((t) => t.toLowerCase())
    .filter(Boolean);

  const aliases = await tx.tagAlias.findMany({
    where: {
      alias: { in: normalizedInput },
    },
    include: {
      tag: true,
    },
  });

  const aliasMap = new Map<string, string>();

  for (const row of aliases) {
    aliasMap.set(row.alias.toLowerCase(), row.tag.slug);
  }

  const resolved = normalizedInput.map((tag) => aliasMap.get(tag) ?? tag);

  return [...new Set(resolved)];
}