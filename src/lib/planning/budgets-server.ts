import type { SupabaseClient } from "@supabase/supabase-js";
import { monthRange } from "@/lib/ai/dates";
import { summarizeBudgets, type BudgetRow, type BudgetWithSpent } from "@/lib/budget-progress";

// Budgets joined with that month's expense totals. Shared by /api/budgets
// and the chat advisor's getBudgets tool.
export async function loadBudgetsWithSpent(
  supabase: SupabaseClient,
  userId: string,
  month: string
): Promise<BudgetWithSpent[]> {
  const { from, to } = monthRange(month);
  const [budgets, expenses] = await Promise.all([
    supabase.from("budgets").select("id, category_key, amount").eq("user_id", userId),
    supabase
      .from("transactions")
      .select("category_key, amount")
      .eq("user_id", userId)
      .eq("type", "expense")
      .gte("date", from)
      .lte("date", to),
  ]);
  if (budgets.error) throw new Error(budgets.error.message);
  if (expenses.error) throw new Error(expenses.error.message);
  return summarizeBudgets((budgets.data ?? []) as BudgetRow[], expenses.data ?? []);
}
