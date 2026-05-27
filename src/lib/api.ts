import type { CategoryKey, TransactionType } from "./mock-data";

export type ApiTransaction = {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  description: string;
  category_key: CategoryKey;
  date: string;
  created_at: string;
};

export async function fetchTransactions(params?: {
  month?: string;
  category?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: ApiTransaction[]; count: number }> {
  const sp = new URLSearchParams();
  if (params?.month) sp.set("month", params.month);
  if (params?.category) sp.set("category", params.category);
  if (params?.type) sp.set("type", params.type);
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.offset) sp.set("offset", String(params.offset));

  const res = await fetch(`/api/transactions?${sp}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function createTransaction(data: {
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  category_key: CategoryKey;
}): Promise<ApiTransaction> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create transaction");
  const json = await res.json();
  return json.data;
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete transaction");
}

export async function categorizeTransaction(
  transactionId: string,
  description: string,
  type: TransactionType
): Promise<CategoryKey> {
  const res = await fetch("/api/ai/categorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactionId, description, type }),
  });
  const json = await res.json();
  return json.category_key;
}

export async function fetchAnomaly(
  language: string
): Promise<string | null> {
  const res = await fetch("/api/ai/anomaly", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language }),
  });
  const json = await res.json();
  return json.anomaly ?? null;
}

export async function fetchReports(): Promise<
  {
    id: string;
    content: string;
    language: string;
    month: string;
    created_at: string;
  }[]
> {
  const res = await fetch("/api/ai/report");
  if (!res.ok) throw new Error("Failed to fetch reports");
  const json = await res.json();
  return json.data;
}

export async function generateReport(
  language: string,
  month: string
): Promise<{ content: string; month: string }> {
  const res = await fetch("/api/ai/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, month }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || "Failed to generate report");
  }
  const json = await res.json();
  return json.data;
}

export async function sendChatMessage(
  message: string,
  history: { role: string; content: string }[],
  language: string
): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, language }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  const json = await res.json();
  return json.reply;
}

export async function updateLanguagePreference(
  language: string
): Promise<void> {
  await fetch("/api/user/language", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language }),
  });
}
