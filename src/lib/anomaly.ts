// Bucketing math for the anomaly detector, extracted so it can be tested
// independently of the route handler and the LLM call.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Which week a transaction falls into, counting back from `now`.
// 0 = this week (last 7 days), 1 = the week before, and so on.
export function weekIndex(now: Date, date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.floor((now.getTime() - d.getTime()) / WEEK_MS);
}
