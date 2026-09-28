import { z } from "zod";
import { CATEGORY_KEYS, type CategoryKey, type TransactionType } from "./mock-data";
import { isValidYmd } from "./ymd";
import { parseRupiahNumber } from "./quick-parse";

// A transaction the user has not saved yet (quick-add, receipt scan, CSV row).
export type Draft = {
  amount: number;
  type: TransactionType;
  description: string;
  date: string; // YYYY-MM-DD
  category_key: CategoryKey;
};

export type ExpenseCategoryKey = Exclude<CategoryKey, "income">;

export const EXPENSE_CATEGORY_KEYS = CATEGORY_KEYS.filter(
  (k): k is ExpenseCategoryKey => k !== "income"
);

const MAX_AMOUNT = 1_000_000_000_000;

const FIELD = {
  amount: z.number().positive().max(MAX_AMOUNT),
  type: z.enum(["income", "expense"]),
  description: z.string().trim().min(1).max(120),
  date: z.string().refine(isValidYmd),
  category_key: z.enum(CATEGORY_KEYS as [CategoryKey, ...CategoryKey[]]),
};

function pick<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const r = schema.safeParse(value);
  return r.success ? r.data : fallback;
}

// Merge an untrusted AI JSON object onto a rule-based draft: each field is
// taken from the AI only when it validates, otherwise the base value stays.
export function mergeAiDraft(base: Draft, ai: unknown): Draft {
  const o = (ai && typeof ai === "object" ? ai : {}) as Record<string, unknown>;
  const amountRaw = typeof o.amount === "string" ? parseRupiahNumber(o.amount) : o.amount;
  const type = pick(FIELD.type, o.type, base.type);
  let category_key = pick(FIELD.category_key, o.category_key, base.category_key);
  if (type === "income") category_key = "income";
  else if (category_key === "income") {
    category_key = base.category_key === "income" ? "shopping" : base.category_key;
  }
  return {
    amount: Math.round(pick(FIELD.amount, amountRaw, base.amount)),
    type,
    description: pick(FIELD.description, o.description, base.description),
    date: pick(FIELD.date, o.date, base.date),
    category_key,
  };
}

// The category actually saved: income rows are always "income", and an expense
// never keeps "income" (e.g. an AI income draft the user flipped to expense).
export function categoryForType(type: TransactionType, category: CategoryKey): CategoryKey {
  if (type === "income") return "income";
  return category === "income" ? "shopping" : category;
}
