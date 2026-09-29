import { describe, it, expect, vi } from "vitest";
import { categorizeExpense } from "./categorize";

describe("categorizeExpense", () => {
  it("uses the keyword rules without calling the AI when they match", async () => {
    const ask = vi.fn();
    expect(await categorizeExpense("Gojek ke kampus", ask)).toBe("transport");
    expect(ask).not.toHaveBeenCalled();
  });

  it("asks the AI when no keyword matches", async () => {
    const ask = vi.fn().mockResolvedValue("Health.");
    expect(await categorizeExpense("Beli masker N95", ask)).toBe("health");
    expect(ask).toHaveBeenCalledOnce();
    expect(ask.mock.calls[0][0]).toContain("Beli masker N95");
  });

  it("falls back to shopping when the AI fails", async () => {
    const ask = vi.fn().mockRejectedValue(new Error("429"));
    expect(await categorizeExpense("Beli masker N95", ask)).toBe("shopping");
  });

  it("falls back to shopping when the AI reply has no expense key", async () => {
    expect(await categorizeExpense("Beli masker N95", async () => "income")).toBe("shopping");
  });
});
