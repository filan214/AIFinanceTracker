import { describe, it, expect } from "vitest";
import { goalProgress, summarizeGoals, pickFeaturedGoal } from "./goal-progress";

const TODAY = "2026-09-27";

describe("goalProgress", () => {
  it("computes months left including the current month and per-month need", () => {
    expect(goalProgress(6_500_000, 12_000_000, "2026-12-31", TODAY)).toEqual({
      saved: 6_500_000,
      pct: (6_500_000 / 12_000_000) * 100,
      remaining: 5_500_000,
      monthsLeft: 4,
      perMonth: 1_375_000,
      status: "active",
    });
  });

  it("rounds per-month up", () => {
    expect(goalProgress(0, 1000, "2026-11-15", TODAY).perMonth).toBe(334); // 1000 / 3
  });

  it("uses at least one month when the target is this month", () => {
    expect(goalProgress(0, 500, "2026-09-30", TODAY)).toMatchObject({ monthsLeft: 1, perMonth: 500 });
  });

  it("has no per-month need without a target date", () => {
    expect(goalProgress(100, 1000, null, TODAY)).toMatchObject({
      status: "active",
      monthsLeft: null,
      perMonth: null,
    });
  });

  it("is done when saved reaches the target (pct capped at 100)", () => {
    expect(goalProgress(1200, 1000, "2026-12-31", TODAY)).toMatchObject({
      status: "done",
      pct: 100,
      remaining: 0,
      perMonth: null,
    });
  });

  it("is overdue past the target date", () => {
    expect(goalProgress(100, 1000, "2026-09-26", TODAY)).toMatchObject({
      status: "overdue",
      perMonth: null,
    });
  });
});

describe("summarizeGoals", () => {
  it("sums string amounts and sorts contributions newest first", () => {
    const [g] = summarizeGoals(
      [
        {
          id: "g1",
          name: "Laptop",
          target_amount: "12000000",
          target_date: null,
          created_at: "2026-06-01T00:00:00Z",
          goal_contributions: [
            { id: "c1", amount: "3000000", date: "2026-06-26" },
            { id: "c2", amount: 500000, date: "2026-09-26" },
          ],
        },
      ],
      TODAY
    );
    expect(g.saved).toBe(3_500_000);
    expect(g.target_amount).toBe(12_000_000);
    expect(g.contributions.map((c) => c.id)).toEqual(["c2", "c1"]);
  });

  it("handles a goal with no contributions", () => {
    const [g] = summarizeGoals(
      [{ id: "g", name: "X", target_amount: 100, target_date: null, created_at: "", goal_contributions: null }],
      TODAY
    );
    expect(g).toMatchObject({ saved: 0, pct: 0, contributions: [] });
  });
});

describe("pickFeaturedGoal", () => {
  it("prefers the unfinished goal with the highest pct, then the nearest date", () => {
    const goals = [
      { id: "a", pct: 50, status: "active" as const, target_date: "2027-01-01" },
      { id: "b", pct: 50, status: "active" as const, target_date: "2026-12-01" },
      { id: "c", pct: 100, status: "done" as const, target_date: null },
      { id: "d", pct: 10, status: "active" as const, target_date: null },
    ];
    expect(pickFeaturedGoal(goals)?.id).toBe("b");
  });
  it("falls back to a done goal, and null when empty", () => {
    expect(pickFeaturedGoal([{ id: "c", pct: 100, status: "done" as const, target_date: null }])?.id).toBe("c");
    expect(pickFeaturedGoal([])).toBeNull();
  });
});
