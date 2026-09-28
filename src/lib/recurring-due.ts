import type { CategoryKey, TransactionType } from "./mock-data";

export type RecurringSchedule = {
  day_of_month: number;
  start_date: string; // YYYY-MM-DD
  last_generated_month: string | null; // YYYY-MM
  active: boolean;
};

export type RecurringRule = RecurringSchedule & {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category_key: CategoryKey;
};

const MAX_MONTHS = 120; // safety bound for very old start dates

// Day 31 in a 30-day month (or February) falls on the month's last day.
export function occurrenceDate(month: string, day: number): string {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month}-${String(Math.min(day, last)).padStart(2, "0")}`;
}

export function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

// last_generated_month to store when a paused rule is resumed: occurrences
// dated before today (the paused period) are skipped, not back-filled.
export function resumeLastMonth(
  rule: Pick<RecurringSchedule, "day_of_month" | "last_generated_month">,
  today: string
): string {
  const thisMonth = today.slice(0, 7);
  const skipTo = occurrenceDate(thisMonth, rule.day_of_month) < today ? thisMonth : prevMonth(thisMonth);
  const last = rule.last_generated_month;
  return last && last > skipTo ? last : skipTo;
}

// Occurrences that are due (date ≤ today) and not generated yet.
export function recurringDue(
  rule: RecurringSchedule,
  today: string
): { dates: string[]; lastGeneratedMonth: string | null } {
  const unchanged = { dates: [], lastGeneratedMonth: rule.last_generated_month };
  if (!rule.active) return unchanged;

  const startMonth = rule.start_date.slice(0, 7);
  const afterLast = rule.last_generated_month ? nextMonth(rule.last_generated_month) : startMonth;
  let month = afterLast > startMonth ? afterLast : startMonth;
  const thisMonth = today.slice(0, 7);

  const dates: string[] = [];
  for (let i = 0; month <= thisMonth && i < MAX_MONTHS; i++) {
    const date = occurrenceDate(month, rule.day_of_month);
    if (date >= rule.start_date && date <= today) dates.push(date);
    month = nextMonth(month);
  }
  if (dates.length === 0) return unchanged;
  return { dates, lastGeneratedMonth: dates[dates.length - 1].slice(0, 7) };
}

// For display: the next date this rule will add a transaction.
export function nextOccurrence(rule: RecurringSchedule, today: string): string | null {
  if (!rule.active) return null;
  const startMonth = rule.start_date.slice(0, 7);
  let month = today.slice(0, 7) > startMonth ? today.slice(0, 7) : startMonth;
  for (let i = 0; i < 24; i++) {
    const date = occurrenceDate(month, rule.day_of_month);
    if (date > today && date >= rule.start_date) return date;
    month = nextMonth(month);
  }
  return null;
}
