// Date-range helpers for the AI tools. Extracted from tools.ts so the
// timezone-anchored math can be tested independently of the tool wiring.

export type Period =
  | "today"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "last_6_months"
  | "this_year";

const TZ = "Asia/Jakarta";

// "Today" anchored to Jakarta, regardless of the host server's local timezone.
export function todayParts(): { y: number; m: number; d: number } {
  const ymdStr = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  const [y, m, d] = ymdStr.split("-").map(Number);
  return { y, m: m - 1, d };
}

// Format YYYY-MM-DD via UTC math so (y, m, d) arithmetic normalizes correctly
// without local-tz drift. month is 0-indexed.
export function ymd(y: number, m: number, d: number): string {
  const dt = new Date(Date.UTC(y, m, d));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function dateRangeForPeriod(period: Period): { from: string; to: string } {
  const { y, m, d } = todayParts();
  switch (period) {
    case "today":
      return { from: ymd(y, m, d), to: ymd(y, m, d) };
    case "this_month":
      return { from: ymd(y, m, 1), to: ymd(y, m + 1, 0) };
    case "last_month":
      return { from: ymd(y, m - 1, 1), to: ymd(y, m, 0) };
    case "last_3_months":
      return { from: ymd(y, m - 2, 1), to: ymd(y, m + 1, 0) };
    case "last_6_months":
      return { from: ymd(y, m - 5, 1), to: ymd(y, m + 1, 0) };
    case "this_year":
      return { from: ymd(y, 0, 1), to: ymd(y, 11, 31) };
  }
}

export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  return { from: ymd(y, m - 1, 1), to: ymd(y, m, 0) };
}

export function currentMonth(): string {
  const { y, m } = todayParts();
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}
