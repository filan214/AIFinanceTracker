import { describe, it, expect } from "vitest";
import { guessCategory } from "./category-rules";

describe("guessCategory", () => {
  it("categorizes common Indonesian and English descriptions", () => {
    expect(guessCategory("bayar kuliah")).toBe("education");
    expect(guessCategory("bensin")).toBe("transport");
    expect(guessCategory("Isi Pertalite motor")).toBe("transport");
    expect(guessCategory("makan siang")).toBe("food");
    expect(guessCategory("GrabFood martabak")).toBe("food");
    expect(guessCategory("Grab ke kantor")).toBe("transport");
    expect(guessCategory("token listrik PLN")).toBe("bills");
    expect(guessCategory("Netflix")).toBe("entertainment");
    expect(guessCategory("beli obat di apotek")).toBe("health");
    expect(guessCategory("setor tabungan")).toBe("savings");
    expect(guessCategory("beli sepatu")).toBe("shopping");
    expect(guessCategory("Monthly rent")).toBe("bills");
  });

  it("matches whole words only", () => {
    // "tol" inside "stolen" or "les" inside "sales" must not match
    expect(guessCategory("stolen sales")).toBeNull();
  });

  it("returns null when nothing matches", () => {
    expect(guessCategory("transfer ke budi")).toBeNull();
    expect(guessCategory("")).toBeNull();
  });
});
