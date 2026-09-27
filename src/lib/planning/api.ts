import type { BudgetWithSpent } from "@/lib/budget-progress";
import type { ExpenseCategoryKey } from "@/lib/draft";
import type { GoalView } from "@/lib/goal-progress";

async function send<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// ---- Budgets ----

export async function fetchBudgets(month: string): Promise<BudgetWithSpent[]> {
  return (await send<{ data: BudgetWithSpent[] }>(`/api/budgets?month=${month}`)).data;
}

export async function saveBudget(category_key: ExpenseCategoryKey, amount: number): Promise<void> {
  await send("/api/budgets", jsonInit("POST", { category_key, amount }));
}

export async function deleteBudget(id: string): Promise<void> {
  await send(`/api/budgets?id=${id}`, { method: "DELETE" });
}

// ---- Goals ----

export type GoalInput = { name: string; target_amount: number; target_date: string | null };
export type ContributionInput = { amount: number; date: string; record_as_expense: boolean };

export async function fetchGoals(): Promise<GoalView[]> {
  return (await send<{ data: GoalView[] }>("/api/goals")).data;
}

export async function createGoal(input: GoalInput): Promise<void> {
  await send("/api/goals", jsonInit("POST", input));
}

export async function updateGoal(id: string, input: GoalInput): Promise<void> {
  await send("/api/goals", jsonInit("PATCH", { id, ...input }));
}

export async function deleteGoal(id: string): Promise<void> {
  await send(`/api/goals?id=${id}`, { method: "DELETE" });
}

export async function addContribution(goal_id: string, input: ContributionInput): Promise<void> {
  await send("/api/goals/contributions", jsonInit("POST", { goal_id, ...input }));
}

export async function deleteContribution(id: string): Promise<void> {
  await send(`/api/goals/contributions?id=${id}`, { method: "DELETE" });
}
