import type { BudgetWithSpent } from "@/lib/budget-progress";
import type { ExpenseCategoryKey } from "@/lib/draft";

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
