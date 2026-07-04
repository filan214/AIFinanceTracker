import { describe, it, expect } from "vitest";
import { weekIndex } from "./anomaly";

// Fixed reference point so the math is deterministic regardless of when tests run.
const now = new Date("2026-07-04T12:00:00Z");

describe("weekIndex", () => {
  it("puts a transaction from today in week 0", () => {
    expect(weekIndex(now, "2026-07-04T09:00:00Z")).toBe(0);
  });

  it("keeps anything within the last 7 days in week 0", () => {
    expect(weekIndex(now, "2026-06-28T12:00:00Z")).toBe(0);
  });

  it("rolls into week 1 just past the 7-day mark", () => {
    expect(weekIndex(now, "2026-06-27T00:00:00Z")).toBe(1);
  });

  it("counts three full weeks back", () => {
    expect(weekIndex(now, "2026-06-10T12:00:00Z")).toBe(3);
  });

  it("accepts a Date as well as a string", () => {
    expect(weekIndex(now, new Date("2026-06-20T12:00:00Z"))).toBe(2);
  });
});
