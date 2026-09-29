import { extractJson } from "@/lib/llm-json";
import { EXPENSE_CATEGORY_KEYS, type ExpenseCategoryKey } from "@/lib/draft";
import { guessCategory } from "@/lib/category-rules";

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

// Keyword rules first; only rows they don't recognize go to the AI, batched.
// askBatch must resolve (it owns its own fallback) to one key per input row.
export async function categorizeKeywordFirst(
  descriptions: string[],
  askBatch: (batch: string[]) => Promise<ExpenseCategoryKey[]>
): Promise<ExpenseCategoryKey[]> {
  const out = descriptions.map((d) => guessCategory(d));
  const unknown = descriptions.filter((_, i) => out[i] === null);
  const answers = (await Promise.all(chunk(unknown, CATEGORIZE_BATCH_SIZE).map((b) => askBatch(b)))).flat();
  let a = 0;
  return out.map((c) => c ?? answers[a++]);
}

// Used when the AI is unavailable or its answer for a row is unusable.
export function fallbackCategories(descriptions: string[]): ExpenseCategoryKey[] {
  return descriptions.map((d) => guessCategory(d) ?? "shopping");
}

export function parseCategoryBatch(raw: string, descriptions: string[]): ExpenseCategoryKey[] {
  const fallback = fallbackCategories(descriptions);
  const parsed = extractJson(raw);
  if (!Array.isArray(parsed) || parsed.length !== descriptions.length) return fallback;
  return parsed.map((v, i) => {
    const k = typeof v === "string" ? v.toLowerCase().trim() : "";
    return (EXPENSE_CATEGORY_KEYS as string[]).includes(k) ? (k as ExpenseCategoryKey) : fallback[i];
  });
}
