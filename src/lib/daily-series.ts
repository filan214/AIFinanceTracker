import { addDays } from "./ymd";

export type DailyRange = "7d" | "month";

// One point per calendar day for the selected month, zero on days with no
// spending, so a chart never draws a straight line across empty days. The
// series ends today for the current month and on the last day for a past one.
export function dailySeries(
  data: { day: string; total: number }[],
  { monthKey, range, today }: { monthKey: string; range: DailyRange; today: string }
): { day: string; total: number }[] {
  const first = `${monthKey}-01`;
  if (today < first) return [];
  const [y, m] = monthKey.split("-").map(Number);
  const lastOfMonth = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const end = today < lastOfMonth ? today : lastOfMonth;
  const weekStart = addDays(end, -6);
  const start = range === "7d" && weekStart > first ? weekStart : first;

  const byDay = new Map(data.map((d) => [d.day, d.total]));
  const out: { day: string; total: number }[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    out.push({ day, total: byDay.get(day) ?? 0 });
  }
  return out;
}
