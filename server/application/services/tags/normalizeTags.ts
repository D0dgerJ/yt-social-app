export function normalizeTags(input: unknown, limit = 8): string[] {
  if (!Array.isArray(input)) return [];

  const normalized = input
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase())
    .map((tag) => tag.replace(/^#+/, ""))          // убрать # в начале
    .map((tag) => tag.replace(/\s+/g, " "))        // схлопнуть пробелы
    .map((tag) => tag.replace(/\s/g, "-"))         // пробелы -> дефисы
    .map((tag) => tag.replace(/-+/g, "-"))         // несколько дефисов -> один
    .map((tag) => tag.replace(/^-+|-+$/g, ""))     // убрать дефисы по краям
    .filter((tag) => tag.length > 0)
    .filter((tag) => tag.length <= 50);

  return [...new Set(normalized)].slice(0, limit);
}