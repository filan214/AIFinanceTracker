import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatSignedCurrency,
  formatPercent,
} from "./format";

describe("formatCurrency", () => {
  it("groups thousands the Indonesian way by default", () => {
    expect(formatCurrency(1240000)).toBe("Rp 1.240.000");
  });

  it("groups thousands with commas in English", () => {
    expect(formatCurrency(1240000, "en")).toBe("Rp 1,240,000");
  });

  it("uses the absolute value (never shows a minus)", () => {
    expect(formatCurrency(-500000)).toBe("Rp 500.000");
  });

  it("drops fractional digits", () => {
    expect(formatCurrency(1999.99)).toBe("Rp 2.000");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("Rp 0");
  });
});

describe("formatSignedCurrency", () => {
  it("prefixes a plus for positive amounts", () => {
    expect(formatSignedCurrency(250000)).toBe("+Rp 250.000");
  });

  it("prefixes a minus for negative amounts", () => {
    expect(formatSignedCurrency(-250000)).toBe("-Rp 250.000");
  });

  it("has no sign for zero", () => {
    expect(formatSignedCurrency(0)).toBe("Rp 0");
  });
});

describe("formatPercent", () => {
  it("adds a plus sign for positive growth by default", () => {
    expect(formatPercent(42)).toBe("+42%");
  });

  it("keeps the minus for negative change", () => {
    expect(formatPercent(-13)).toBe("-13%");
  });

  it("omits the sign when withSign is false", () => {
    expect(formatPercent(42, "id", false)).toBe("42%");
  });

  it("has no plus for zero", () => {
    expect(formatPercent(0)).toBe("0%");
  });
});
