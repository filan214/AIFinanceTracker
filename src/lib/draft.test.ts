import { describe, it, expect } from "vitest";
import { mergeAiDraft, EXPENSE_CATEGORY_KEYS, type Draft } from "./draft";

const BASE: Draft = {
  amount: 35000,
  type: "expense",
  description: "Makan siang",
  date: "2026-09-26",
  category_key: "shopping",
};

describe("EXPENSE_CATEGORY_KEYS", () => {
  it("has every category except income", () => {
    expect(EXPENSE_CATEGORY_KEYS).toHaveLength(8);
    expect(EXPENSE_CATEGORY_KEYS).not.toContain("income");
  });
});

describe("mergeAiDraft", () => {
  it("takes valid AI fields", () => {
    const out = mergeAiDraft(BASE, {
      amount: 36000,
      type: "expense",
      description: "Makan siang warteg",
      date: "2026-09-25",
      category_key: "food",
    });
    expect(out).toEqual({
      amount: 36000,
      type: "expense",
      description: "Makan siang warteg",
      date: "2026-09-25",
      category_key: "food",
    });
  });

  it("keeps base values for invalid AI fields", () => {
    const out = mergeAiDraft(BASE, {
      amount: -5,
      type: "loan",
      description: "",
      date: "2026-02-30",
      category_key: "groceries",
    });
    expect(out).toEqual(BASE);
  });

  it("rejects zero, huge, and non-numeric amounts", () => {
    expect(mergeAiDraft(BASE, { amount: 0 }).amount).toBe(35000);
    expect(mergeAiDraft(BASE, { amount: 1e13 }).amount).toBe(35000);
    expect(mergeAiDraft(BASE, { amount: "abc" }).amount).toBe(35000);
  });

  it("accepts a numeric string amount", () => {
    expect(mergeAiDraft(BASE, { amount: "42000" }).amount).toBe(42000);
  });

  it("forces income category for income and never income for expense", () => {
    expect(mergeAiDraft(BASE, { type: "income", category_key: "food" }).category_key).toBe("income");
    expect(mergeAiDraft(BASE, { type: "expense", category_key: "income" }).category_key).toBe("shopping");
  });

  it("returns base for non-object input", () => {
    expect(mergeAiDraft(BASE, null)).toEqual(BASE);
    expect(mergeAiDraft(BASE, "food")).toEqual(BASE);
  });
});
