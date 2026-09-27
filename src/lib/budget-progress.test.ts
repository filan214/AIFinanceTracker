import { describe, it, expect } from "vitest";
import { budgetProgress, summarizeBudgets, daysLeftInMonth } from "./budget-progress";

describe("budgetProgress", () => {
  it("is ok below 80%", () => {
    expect(budgetProgress(0, 1000)).toEqual({ pct: 0, status: "ok", remaining: 1000 });
    expect(budgetProgress(799, 1000).status).toBe("ok");
  });
  it("warns from 80% up to and including 100%", () => {
    expect(budgetProgress(800, 1000).status).toBe("warn");
    expect(budgetProgress(1000, 1000).status).toBe("warn");
  });
  it("is over above 100% with negative remaining", () => {
    expect(budgetProgress(1001, 1000)).toMatchObject({ status: "over", remaining: -1 });
  });
  it("guards a zero limit", () => {
    expect(budgetProgress(500, 0)).toEqual({ pct: 0, status: "ok", remaining: -500 });
  });
});

describe("summarizeBudgets", () => {
  it("sums numeric-string amounts per category and sorts by pct", () => {
    const out = summarizeBudgets(
      [
        { id: "a", category_key: "food", amount: "1500000" },
        { id: "b", category_key: "transport", amount: 600000 },
        { id: "c", category_key: "shopping", amount: "800000" },
      ],
      [
        { category_key: "food", amount: "1000000" },
        { category_key: "food", amount: "350000" },
        { category_key: "transport", amount: 420000 },
        { category_key: "health", amount: 99999 },
      ]
    );
    expect(out.map((b) => b.id)).toEqual(["a", "b", "c"]);
    expect(out[0]).toMatchObject({ amount: 1500000, spent: 1350000, pct: 90, status: "warn" });
    expect(out[1]).toMatchObject({ spent: 420000, pct: 70, status: "ok" });
    expect(out[2]).toMatchObject({ spent: 0, pct: 0, remaining: 800000 });
  });
});

describe("daysLeftInMonth", () => {
  it("counts today for the current month", () => {
    expect(daysLeftInMonth("2026-09", "2026-09-27")).toBe(4);
    expect(daysLeftInMonth("2026-09", "2026-09-30")).toBe(1);
    expect(daysLeftInMonth("2026-02", "2026-02-01")).toBe(28);
  });
  it("is null for other months", () => {
    expect(daysLeftInMonth("2026-08", "2026-09-27")).toBeNull();
  });
});
