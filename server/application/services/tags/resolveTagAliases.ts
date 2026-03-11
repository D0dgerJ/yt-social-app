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

  const aliases = await tx.tagAlias.findMany({
    where: {
      alias: { in: tags },
    },
    include: {
      tag: true,
    },
  });

  const aliasMap = new Map<string, string>();
  for (const row of aliases) {
    aliasMap.set(row.alias, row.tag.slug);
  }

  const resolved = tags.map((tag) => aliasMap.get(tag) ?? tag);

  return [...new Set(resolved)];
}