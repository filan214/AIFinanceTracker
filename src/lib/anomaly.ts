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

// Pre-check that decides whether the AI is worth asking at all: true when any
// category this week (week_0) is more than 20% above its average over weeks
// 1–3 (a missing week counts as zero). Deliberately looser than what the model
// calls "significant", so it only skips weeks the model would call normal anyway.
// A category-level check also covers a weekly-total spike: the total can't
// rise 20% unless some category did.
export function hasSpendingSpike(weekly: Record<string, Record<string, number>>): boolean {
  const thisWeek = weekly.week_0 ?? {};
  return Object.entries(thisWeek).some(([category, spent]) => {
    const typical =
      [1, 2, 3].reduce((sum, w) => sum + (weekly[`week_${w}`]?.[category] ?? 0), 0) / 3;
    return spent > typical * 1.2;
  });
}

type Triggered = Extract<AnomalyResult, { detected: true }>["triggeredTransactions"];

// isNew is computed here rather than by the model, so the prompt doesn't have
// to carry every description from the previous 3 weeks. Uses the stored
// description (by id), since the model may paraphrase its copy.
export function markNewTransactions(
  triggered: Triggered,
  txns: { id: string; description: string }[],
  priorDescriptions: Set<string>
): Triggered {
  const descriptionById = new Map(txns.map((t) => [t.id, t.description]));
  return triggered.map((t) => ({
    ...t,
    isNew: !priorDescriptions.has(descriptionById.get(t.id) ?? t.description),
  }));
}

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
