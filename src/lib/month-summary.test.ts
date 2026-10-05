import { describe, it, expect } from "vitest";
import { summarizeMonth } from "./month-summary";

const october = {
  income: 0,
  expense: 918977,
  byCategory: [
    { category_key: "bills" as const, total: 750000 },
    { category_key: "shopping" as const, total: 113987 },
    { category_key: "entertainment" as const, total: 54990 },
  ],
};

describe("summarizeMonth", () => {
  it("compares spending with the month before and names the biggest category", () => {
    expect(summarizeMonth(october, { expense: 13000000 })).toEqual({
      spent: 918977,
      direction: "less",
      changePct: 93,
      top: { key: "bills", share: 82 },
      overspent: true,
    });
  });

  it("reports more spending as a positive percentage with direction more", () => {
    const s = summarizeMonth({ ...october, income: 5000000 }, { expense: 500000 });
    expect(s.direction).toBe("more");
    expect(s.changePct).toBe(84);
    expect(s.overspent).toBe(false);
  });

  it("calls it the same when the change rounds to 0%", () => {
    const s = summarizeMonth(october, { expense: 918000 });
    expect(s.direction).toBe("same");
    expect(s.changePct).toBe(0);
  });

  it("makes no comparison when nothing was spent the month before", () => {
    const s = summarizeMonth(october, { expense: 0 });
    expect(s.direction).toBeNull();
    expect(s.changePct).toBeNull();
  });

  it("has no top category and no overspend when nothing was spent", () => {
    expect(summarizeMonth({ income: 0, expense: 0, byCategory: [] }, { expense: 100 })).toEqual({
      spent: 0,
      direction: "less",
      changePct: 100,
      top: null,
      overspent: false,
    });
  });
});
