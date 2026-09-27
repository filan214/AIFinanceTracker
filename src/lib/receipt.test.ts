import { describe, it, expect } from "vitest";
import { normalizeReceipt } from "./receipt";

const TODAY = "2026-09-27";

describe("normalizeReceipt", () => {
  it("maps a clean AI reply to an expense draft", () => {
    expect(
      normalizeReceipt(
        { total: 125000, date: "2026-09-20", merchant: " Indomaret ", category_key: "food" },
        TODAY
      )
    ).toEqual({
      amount: 125000,
      type: "expense",
      description: "Indomaret",
      date: "2026-09-20",
      category_key: "food",
    });
  });

  it("parses a formatted string total", () => {
    expect(normalizeReceipt({ total: "Rp 125.000", merchant: "Alfamart" }, TODAY)?.amount).toBe(125000);
  });

  it("falls back to today for missing, invalid, or future dates", () => {
    expect(normalizeReceipt({ total: 1000 }, TODAY)?.date).toBe(TODAY);
    expect(normalizeReceipt({ total: 1000, date: "2026-02-30" }, TODAY)?.date).toBe(TODAY);
    expect(normalizeReceipt({ total: 1000, date: "2027-01-01" }, TODAY)?.date).toBe(TODAY);
  });

  it("uses shopping for unknown or income categories and empty description without merchant", () => {
    const d = normalizeReceipt({ total: 1000, category_key: "income" }, TODAY);
    expect(d?.category_key).toBe("shopping");
    expect(d?.description).toBe("");
  });

  it("returns null when there is no usable total", () => {
    expect(normalizeReceipt({ total: null }, TODAY)).toBeNull();
    expect(normalizeReceipt({ total: 0 }, TODAY)).toBeNull();
    expect(normalizeReceipt({ total: "n/a" }, TODAY)).toBeNull();
    expect(normalizeReceipt(null, TODAY)).toBeNull();
  });
});
