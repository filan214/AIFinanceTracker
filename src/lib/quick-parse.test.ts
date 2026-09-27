import { describe, it, expect } from "vitest";
import { quickParse, parseRupiahNumber } from "./quick-parse";

const TODAY = "2026-09-27";

describe("parseRupiahNumber", () => {
  it("parses thousands separators", () => {
    expect(parseRupiahNumber("Rp 12.000")).toBe(12000);
    expect(parseRupiahNumber("12,500")).toBe(12500);
    expect(parseRupiahNumber("1.500.000")).toBe(1500000);
    expect(parseRupiahNumber("50000")).toBe(50000);
  });
  it("drops a 1-2 digit decimal tail", () => {
    expect(parseRupiahNumber("12.000,50")).toBe(12000);
  });
  it("returns null without digits", () => {
    expect(parseRupiahNumber("abc")).toBeNull();
  });
});

describe("quickParse", () => {
  it("parses rb suffix and kemarin", () => {
    expect(quickParse("makan siang 35rb kemarin", TODAY)).toEqual({
      amount: 35000,
      type: "expense",
      description: "Makan siang",
      date: "2026-09-26",
      category_key: "shopping",
    });
  });

  it("parses jt with a decimal comma and detects income", () => {
    const d = quickParse("Gaji September 8,5jt", TODAY);
    expect(d.amount).toBe(8500000);
    expect(d.type).toBe("income");
    expect(d.category_key).toBe("income");
    expect(d.description).toBe("Gaji September");
    expect(d.date).toBe(TODAY);
  });

  it("parses 1.5jt, 35k, and today", () => {
    expect(quickParse("laptop service 1.5jt", TODAY).amount).toBe(1500000);
    const d = quickParse("35k grab today", TODAY);
    expect(d.amount).toBe(35000);
    expect(d.description).toBe("Grab");
    expect(d.date).toBe(TODAY);
  });

  it("parses Rp prefix", () => {
    const d = quickParse("Rp 12.000 parkir", TODAY);
    expect(d.amount).toBe(12000);
    expect(d.description).toBe("Parkir");
  });

  it("uses the largest plain number", () => {
    const d = quickParse("kopi 2 25000", TODAY);
    expect(d.amount).toBe(25000);
    expect(d.description).toBe("Kopi 2");
  });

  it("parses yesterday in English", () => {
    expect(quickParse("coffee 30rb yesterday", TODAY).date).toBe("2026-09-26");
  });

  it("returns amount 0 when there is no number", () => {
    const d = quickParse("kopi", TODAY);
    expect(d.amount).toBe(0);
    expect(d.description).toBe("Kopi");
  });

  it("handles empty input", () => {
    expect(quickParse("", TODAY)).toEqual({
      amount: 0,
      type: "expense",
      description: "",
      date: TODAY,
      category_key: "shopping",
    });
  });
});
