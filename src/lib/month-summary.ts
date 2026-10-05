import type { CategoryKey } from "./mock-data";

export type MonthSummary = {
  spent: number;
  // Change in spending vs the month before; null when that month had none.
  direction: "more" | "less" | "same" | null;
  changePct: number | null;
  top: { key: CategoryKey; share: number } | null;
  overspent: boolean;
};

// Facts for the dashboard's month summary, from figures the dashboard already
// holds. `byCategory` must be sorted by total, largest first.
export function summarizeMonth(
  current: { income: number; expense: number; byCategory: { category_key: CategoryKey; total: number }[] },
  previous: { expense: number }
): MonthSummary {
  const spent = current.expense;
  let direction: MonthSummary["direction"] = null;
  let changePct: number | null = null;
  if (previous.expense > 0) {
    const change = Math.round(((spent - previous.expense) / previous.expense) * 100);
    direction = change > 0 ? "more" : change < 0 ? "less" : "same";
    changePct = Math.abs(change);
  }
  const first = current.byCategory[0];
  const top =
    spent > 0 && first ? { key: first.category_key, share: Math.round((first.total / spent) * 100) } : null;
  return { spent, direction, changePct, top, overspent: spent > current.income };
}
