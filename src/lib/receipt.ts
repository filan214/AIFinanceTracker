import { EXPENSE_CATEGORY_KEYS, type Draft, type ExpenseCategoryKey } from "./draft";
import { parseRupiahNumber } from "./quick-parse";
import { isValidYmd } from "./ymd";

// Base64 data URL of a ~3 MB image; Vercel's request body limit is 4.5 MB.
export const MAX_RECEIPT_DATA_URL_CHARS = 4_000_000;

// A receipt total is never a fraction of a Rupiah. Some models emit an
// ID-formatted amount ("57.720") as a raw JSON number, losing the thousands
// separator to JSON's decimal point ("57.720" -> 57.72); scale it back up.
function fixFractionalTotal(n: number): number {
  return Number.isInteger(n) ? n : n * 1000;
}

// Turn the model's receipt JSON into an expense draft, or null if no total.
export function normalizeReceipt(ai: unknown, today: string): Draft | null {
  const o = (ai && typeof ai === "object" ? ai : {}) as Record<string, unknown>;
  const total =
    typeof o.total === "number"
      ? fixFractionalTotal(o.total)
      : typeof o.total === "string"
        ? parseRupiahNumber(o.total)
        : null;
  if (total === null || !Number.isFinite(total) || total <= 0) return null;

  const date =
    typeof o.date === "string" && isValidYmd(o.date) && o.date <= today ? o.date : today;
  const merchant = typeof o.merchant === "string" ? o.merchant.trim().slice(0, 120) : "";
  const category_key =
    typeof o.category_key === "string" &&
    (EXPENSE_CATEGORY_KEYS as string[]).includes(o.category_key)
      ? (o.category_key as ExpenseCategoryKey)
      : "shopping";

  return { amount: Math.round(total), type: "expense", description: merchant, date, category_key };
}
