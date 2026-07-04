import { describe, it, expect, afterEach, vi } from "vitest";
import {
  ymd,
  monthRange,
  dateRangeForPeriod,
  currentMonth,
  todayParts,
} from "./dates";

describe("ymd", () => {
  it("formats a 0-indexed month as a padded YYYY-MM-DD string", () => {
    expect(ymd(2026, 6, 4)).toBe("2026-07-04"); // month 6 === July
    expect(ymd(2026, 0, 5)).toBe("2026-01-05");
  });

  it("treats day 0 as the last day of the previous month", () => {
    expect(ymd(2026, 7, 0)).toBe("2026-07-31"); // last day of July
    expect(ymd(2026, 2, 0)).toBe("2026-02-28"); // Feb, non-leap
    expect(ymd(2024, 2, 0)).toBe("2024-02-29"); // Feb, leap year
  });

  it("normalizes month overflow into the next year", () => {
    expect(ymd(2026, 12, 1)).toBe("2027-01-01");
  });

  it("normalizes month underflow into the previous year", () => {
    expect(ymd(2026, -1, 1)).toBe("2025-12-01");
  });
});

describe("monthRange", () => {
  it("spans the first to the last day of the given month", () => {
    expect(monthRange("2026-07")).toEqual({
      from: "2026-07-01",
      to: "2026-07-31",
    });
  });

  it("handles February in a non-leap year", () => {
    expect(monthRange("2026-02")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });

  it("handles February in a leap year", () => {
    expect(monthRange("2024-02")).toEqual({
      from: "2024-02-01",
      to: "2024-02-29",
    });
  });
});

describe("Jakarta-anchored 'today' helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // Anchor to a fixed instant so the assertions are deterministic.
  function freeze(iso: string) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
  }

  it("reads the Jakarta wall-clock date, not the UTC one", () => {
    // 18:00 UTC on Jul 31 is already 01:00 on Aug 1 in Jakarta (UTC+7).
    freeze("2026-07-31T18:00:00Z");
    expect(todayParts()).toEqual({ y: 2026, m: 7, d: 1 }); // month 7 === August
    expect(currentMonth()).toBe("2026-08");
  });

  it("computes this_month and last_month ranges around 'today'", () => {
    freeze("2026-07-04T05:00:00Z"); // Jakarta noon, Jul 4
    expect(dateRangeForPeriod("this_month")).toEqual({
      from: "2026-07-01",
      to: "2026-07-31",
    });
    expect(dateRangeForPeriod("last_month")).toEqual({
      from: "2026-06-01",
      to: "2026-06-30",
    });
  });

  it("computes a single-day range for 'today'", () => {
    freeze("2026-07-04T05:00:00Z");
    expect(dateRangeForPeriod("today")).toEqual({
      from: "2026-07-04",
      to: "2026-07-04",
    });
  });

  it("spans whole months for last_3_months and the full calendar for this_year", () => {
    freeze("2026-07-04T05:00:00Z");
    expect(dateRangeForPeriod("last_3_months")).toEqual({
      from: "2026-05-01",
      to: "2026-07-31",
    });
    expect(dateRangeForPeriod("this_year")).toEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });
});
