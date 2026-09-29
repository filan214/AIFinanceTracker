import { describe, it, expect, vi } from "vitest";
import {
  chunk,
  parseCategoryBatch,
  buildCategorizePrompt,
  fallbackCategories,
  categorizeKeywordFirst,
} from "./batch";

describe("categorizeKeywordFirst", () => {
  it("doesn't call the AI when every row matches a keyword", async () => {
    const askBatch = vi.fn();
    expect(await categorizeKeywordFirst(["KOPI KENANGAN", "GRAB* RIDE"], askBatch)).toEqual([
      "food",
      "transport",
    ]);
    expect(askBatch).not.toHaveBeenCalled();
  });

  it("sends only unmatched rows to the AI and merges results back in order", async () => {
    const askBatch = vi.fn(async (batch: string[]) => batch.map(() => "health" as const));
    expect(
      await categorizeKeywordFirst(["TRSF BUDI", "KOPI KENANGAN", "MASKER N95"], askBatch)
    ).toEqual(["health", "food", "health"]);
    expect(askBatch).toHaveBeenCalledOnce();
    expect(askBatch).toHaveBeenCalledWith(["TRSF BUDI", "MASKER N95"]);
  });

  it("batches unmatched rows by CATEGORIZE_BATCH_SIZE", async () => {
    const rows = Array.from({ length: 120 }, (_, i) => `TRSF ${i}`);
    const askBatch = vi.fn(async (batch: string[]) => batch.map(() => "bills" as const));
    const out = await categorizeKeywordFirst(rows, askBatch);
    expect(askBatch.mock.calls.map((c) => c[0].length)).toEqual([50, 50, 20]);
    expect(out).toHaveLength(120);
  });
});

describe("chunk", () => {
  it("splits into fixed-size batches", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 50)).toEqual([]);
    expect(chunk(Array.from({ length: 120 }, (_, i) => i), 50).map((b) => b.length)).toEqual([50, 50, 20]);
  });
});

describe("parseCategoryBatch", () => {
  it("accepts a valid array (case-insensitive)", () => {
    expect(parseCategoryBatch('["food", "Transport"]', ["a", "b"])).toEqual(["food", "transport"]);
  });
  it("replaces unknown or income keys with the row's fallback", () => {
    expect(parseCategoryBatch('["food","groceries","income"]', ["a", "b", "c"])).toEqual(["food", "shopping", "shopping"]);
    expect(parseCategoryBatch('["food","groceries"]', ["a", "SPBU bensin"])).toEqual(["food", "transport"]);
  });
  it("falls back entirely on wrong length or non-JSON", () => {
    expect(parseCategoryBatch('["food"]', ["a", "b"])).toEqual(["shopping", "shopping"]);
    expect(parseCategoryBatch("sorry, I can't", ["a", "b"])).toEqual(["shopping", "shopping"]);
    expect(parseCategoryBatch('{"a":1}', ["a"])).toEqual(["shopping"]);
    expect(parseCategoryBatch("sorry", ["UKT kuliah", "GRAB* RIDE"])).toEqual(["education", "transport"]);
  });
});

describe("fallbackCategories", () => {
  it("uses keyword rules per row, shopping otherwise", () => {
    expect(fallbackCategories(["KOPI KENANGAN", "TRSF BUDI"])).toEqual(["food", "shopping"]);
  });
});

describe("buildCategorizePrompt", () => {
  it("includes the count and JSON-encoded descriptions", () => {
    const p = buildCategorizePrompt(['Kopi "Tuku"', "Grab"]);
    expect(p).toContain("2 category keys");
    expect(p).toContain(JSON.stringify(['Kopi "Tuku"', "Grab"]));
  });
});
