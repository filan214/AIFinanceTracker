import { extractJson } from "@/lib/llm-json";
import { EXPENSE_CATEGORY_KEYS, type ExpenseCategoryKey } from "@/lib/draft";

// 500 rows → at most 10 AI calls, well inside the free daily quota.
export const CATEGORIZE_BATCH_SIZE = 50;

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function buildCategorizePrompt(descriptions: string[]): string {
  return `You categorize bank transaction descriptions (all are expenses).
Categories: food, transport, entertainment, shopping, bills, health, education, savings.
Return ONLY a JSON array of ${descriptions.length} category keys, in the same order as the input.

Input:
${JSON.stringify(descriptions)}`;
}

export function parseCategoryBatch(raw: string, expected: number): ExpenseCategoryKey[] {
  const fallback: ExpenseCategoryKey[] = Array(expected).fill("shopping");
  const parsed = extractJson(raw);
  if (!Array.isArray(parsed) || parsed.length !== expected) return fallback;
  return parsed.map((v) => {
    const k = typeof v === "string" ? v.toLowerCase().trim() : "";
    return (EXPENSE_CATEGORY_KEYS as string[]).includes(k) ? (k as ExpenseCategoryKey) : "shopping";
  });
}
