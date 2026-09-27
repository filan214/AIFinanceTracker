export type GoalStatus = "active" | "done" | "overdue";

export type GoalProgress = {
  saved: number;
  pct: number;
  remaining: number;
  monthsLeft: number | null;
  perMonth: number | null;
  status: GoalStatus;
};

export function goalProgress(
  saved: number,
  target: number,
  targetDate: string | null,
  today: string
): GoalProgress {
  const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
  const remaining = Math.max(0, target - saved);
  const none = { monthsLeft: null, perMonth: null };
  if (remaining === 0) return { saved, pct, remaining, ...none, status: "done" };
  if (!targetDate) return { saved, pct, remaining, ...none, status: "active" };
  if (targetDate < today) return { saved, pct, remaining, ...none, status: "overdue" };

  const [ty, tm] = targetDate.split("-").map(Number);
  const [y, m] = today.split("-").map(Number);
  const monthsLeft = Math.max(1, (ty - y) * 12 + (tm - m) + 1);
  return {
    saved,
    pct,
    remaining,
    monthsLeft,
    perMonth: Math.ceil(remaining / monthsLeft),
    status: "active",
  };
}

export type GoalRow = {
  id: string;
  name: string;
  target_amount: number | string;
  target_date: string | null;
  created_at: string;
  goal_contributions: { id: string; amount: number | string; date: string }[] | null;
};

export type Contribution = { id: string; amount: number; date: string };

export type GoalView = GoalProgress & {
  id: string;
  name: string;
  target_amount: number;
  target_date: string | null;
  contributions: Contribution[];
};

// PostgREST may return numeric columns as strings, hence Number() everywhere.
export function summarizeGoals(rows: GoalRow[], today: string): GoalView[] {
  return rows.map((r) => {
    const contributions = (r.goal_contributions ?? [])
      .map((c) => ({ id: c.id, amount: Number(c.amount), date: c.date }))
      .sort((a, b) => b.date.localeCompare(a.date));
    const saved = contributions.reduce((s, c) => s + c.amount, 0);
    const target = Number(r.target_amount);
    return {
      id: r.id,
      name: r.name,
      target_amount: target,
      target_date: r.target_date,
      contributions,
      ...goalProgress(saved, target, r.target_date, today),
    };
  });
}

// Dashboard highlight: the unfinished goal closest to completion (ties → nearest date).
export function pickFeaturedGoal<
  T extends { pct: number; status: GoalStatus; target_date: string | null }
>(goals: T[]): T | null {
  if (goals.length === 0) return null;
  const open = goals.filter((g) => g.status !== "done");
  const pool = open.length > 0 ? open : goals;
  const far = "9999-12-31";
  return [...pool].sort(
    (a, b) => b.pct - a.pct || (a.target_date ?? far).localeCompare(b.target_date ?? far)
  )[0];
}
