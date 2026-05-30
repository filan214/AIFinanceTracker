import type { CategoryKey, TransactionType } from "./mock-data";
import type { AIReportContent, ReportData } from "@/types/report";
import { clearAnomalyCache } from "./anomaly-cache";

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
  clearAnomalyCache();
  return json.data;
}

export async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete transaction");
  clearAnomalyCache();
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

// DB-computed report numbers (metrics, breakdown, trend, movers, highlights).
export async function fetchReportData(month: string): Promise<ReportData> {
  const res = await fetch(`/api/reports/data?month=${month}`);
  if (!res.ok) throw new Error("Failed to fetch report data");
  const json = await res.json();
  return json.data;
}

// Cached AI content (narrative + recommendations) for a month, or null if none.
export async function fetchCachedReport(
  month: string,
  language: string
): Promise<AIReportContent | null> {
  const res = await fetch(`/api/ai/report?month=${month}`);
  if (!res.ok) return null;
  const json = await res.json();
  const rows = (json.data ?? []) as { language: string; content: string }[];
  const row = rows.find((r) => r.language === language);
  if (!row) return null;
  try {
    return JSON.parse(row.content) as AIReportContent;
  } catch {
    return null;
  }
}

// Generate (and cache) the AI content for a month. Pass regenerate to overwrite.
export async function generateAIReport(
  month: string,
  language: string,
  regenerate = false
): Promise<AIReportContent> {
  const res = await fetch("/api/ai/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, month, regenerate }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error || "Failed to generate report");
  }
  const json = await res.json();
  return json.data;
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

export async function deleteUserData(): Promise<void> {
  const res = await fetch("/api/user/data", { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete data");
}

export function exportTransactionsCsv(
  transactions: ApiTransaction[],
  filename: string
) {
  const header = "Date,Description,Category,Type,Amount";
  const rows = transactions.map(
    (t) =>
      `${t.date},"${t.description.replace(/"/g, '""')}",${t.category_key},${t.type},${t.amount}`
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
