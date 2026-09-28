// Bucketing math for the anomaly detector, extracted so it can be tested
// independently of the route handler and the LLM call.
import type { AnomalyResult } from "@/types/anomaly";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Which week a transaction falls into, counting back from `now`.
// 0 = this week (last 7 days), 1 = the week before, and so on.
export function weekIndex(now: Date, date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.floor((now.getTime() - d.getTime()) / WEEK_MS);
}

type Triggered = Extract<AnomalyResult, { detected: true }>["triggeredTransactions"];

// The model picks triggeredTransactions from a flat this-week list without
// per-transaction category data, so it can attribute a row to the wrong
// category's spike (e.g. a "savings" goal top-up swept into a "shopping"
// anomaly). Drop anything whose real, stored category doesn't match, or
// whose id the model made up.
export function filterTriggeredTransactions(
  triggered: Triggered,
  category: string,
  txns: { id: string; category_key: string }[]
): Triggered {
  const categoryById = new Map(txns.map((t) => [t.id, t.category_key]));
  return triggered.filter((t) => categoryById.get(t.id) === category);
}
