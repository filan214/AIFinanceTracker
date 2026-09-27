import { describe, it, expect } from "vitest";
import { isValidYmd, addDays } from "./ymd";

describe("isValidYmd", () => {
  it("accepts real dates", () => {
    expect(isValidYmd("2026-09-27")).toBe(true);
    expect(isValidYmd("2028-02-29")).toBe(true);
  });
  it("rejects impossible or malformed dates", () => {
    expect(isValidYmd("2026-02-30")).toBe(false);
    expect(isValidYmd("2026-13-01")).toBe(false);
    expect(isValidYmd("27/09/2026")).toBe(false);
    expect(isValidYmd("")).toBe(false);
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});
