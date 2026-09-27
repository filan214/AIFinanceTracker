import type { CategoryKey } from "./mock-data";

export type BudgetStatus = "ok" | "warn" | "over";

const WARN_AT = 80;

export function budgetProgress(
  spent: number,
  limit: number
): { pct: number; status: BudgetStatus; remaining: number } {
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const status: BudgetStatus = pct > 100 ? "over" : pct >= WARN_AT ? "warn" : "ok";
  return { pct, status, remaining: limit - spent };
}

export type BudgetRow = { id: string; category_key: CategoryKey; amount: number | string };

export type BudgetWithSpent = {
  id: string;
  category_key: CategoryKey;
  amount: number;
  spent: number;
  pct: number;
  status: BudgetStatus;
  remaining: number;
};

// PostgREST may return numeric columns as strings, hence Number() everywhere.
export function summarizeBudgets(
  budgets: BudgetRow[],
  expenses: { category_key: string; amount: number | string }[]
): BudgetWithSpent[] {
  const spentBy = new Map<string, number>();
  for (const e of expenses) {
    spentBy.set(e.category_key, (spentBy.get(e.category_key) ?? 0) + Number(e.amount));
  }
  return budgets
    .map((b) => {
      const amount = Number(b.amount);
      const spent = spentBy.get(b.category_key) ?? 0;
      return { id: b.id, category_key: b.category_key, amount, spent, ...budgetProgress(spent, amount) };
    })
    .sort((a, b) => b.pct - a.pct);
}

// Days left in `month` counting today, or null when `month` isn't today's month.
export function daysLeftInMonth(month: string, today: string): number | null {
  if (today.slice(0, 7) !== month) return null;
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return last - Number(today.slice(8, 10)) + 1;
}
