import { TAG_KEYWORD_MAP } from "./tagKeywordMap.ts";

interface ExtractAutoRuleTagsInput {
  desc?: string;
  manualTags?: string[];
  limit?: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractAutoRuleTags({
  desc,
  manualTags = [],
  limit = 8,
}: ExtractAutoRuleTagsInput): string[] {
  const haystack = [desc ?? "", ...manualTags].join(" ").toLowerCase().trim();
  if (!haystack) return [];

  const matched: string[] = [];

  for (const [tagSlug, keywords] of Object.entries(TAG_KEYWORD_MAP)) {
    const hasMatch = keywords.some((keyword) => {
      const pattern = new RegExp(`(^|\\W)${escapeRegExp(keyword.toLowerCase())}(\\W|$)`, "i");
      return pattern.test(haystack);
    });

    if (hasMatch) {
      matched.push(tagSlug);
    }
  }

  return [...new Set(matched)].slice(0, limit);
}