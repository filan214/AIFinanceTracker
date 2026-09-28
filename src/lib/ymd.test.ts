import { describe, it, expect } from "vitest";
import { isValidYmd, addDays, isValidMonth } from "./ymd";

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

describe("isValidMonth", () => {
  it("accepts 01 through 12", () => {
    expect(isValidMonth("2026-01")).toBe(true);
    expect(isValidMonth("2026-12")).toBe(true);
    expect(isValidMonth("2026-09")).toBe(true);
  });
  it("rejects an out-of-range or malformed month", () => {
    expect(isValidMonth("2026-13")).toBe(false);
    expect(isValidMonth("2026-00")).toBe(false);
    expect(isValidMonth("2026-9")).toBe(false);
    expect(isValidMonth("09-2026")).toBe(false);
    expect(isValidMonth("")).toBe(false);
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});
