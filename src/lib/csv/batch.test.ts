import { describe, it, expect } from "vitest";
import { chunk, parseCategoryBatch, buildCategorizePrompt } from "./batch";

describe("chunk", () => {
  it("splits into fixed-size batches", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 50)).toEqual([]);
    expect(chunk(Array.from({ length: 120 }, (_, i) => i), 50).map((b) => b.length)).toEqual([50, 50, 20]);
  });
});

describe("parseCategoryBatch", () => {
  it("accepts a valid array (case-insensitive)", () => {
    expect(parseCategoryBatch('["food", "Transport"]', 2)).toEqual(["food", "transport"]);
  });
  it("replaces unknown or income keys with shopping", () => {
    expect(parseCategoryBatch('["food","groceries","income"]', 3)).toEqual(["food", "shopping", "shopping"]);
  });
  it("falls back entirely on wrong length or non-JSON", () => {
    expect(parseCategoryBatch('["food"]', 2)).toEqual(["shopping", "shopping"]);
    expect(parseCategoryBatch("sorry, I can't", 2)).toEqual(["shopping", "shopping"]);
    expect(parseCategoryBatch('{"a":1}', 1)).toEqual(["shopping"]);
  });
});

describe("buildCategorizePrompt", () => {
  it("includes the count and JSON-encoded descriptions", () => {
    const p = buildCategorizePrompt(['Kopi "Tuku"', "Grab"]);
    expect(p).toContain("2 category keys");
    expect(p).toContain(JSON.stringify(['Kopi "Tuku"', "Grab"]));
  });
});
