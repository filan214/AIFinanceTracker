import { describe, it, expect } from "vitest";
import { occurrenceDate, nextMonth, recurringDue, nextOccurrence, resumeLastMonth } from "./recurring-due";

const rule = (over: Partial<Parameters<typeof recurringDue>[0]> = {}) => ({
  day_of_month: 5,
  start_date: "2026-08-01",
  last_generated_month: null as string | null,
  active: true,
  ...over,
});

describe("occurrenceDate", () => {
  it("clamps to the last day of short months", () => {
    expect(occurrenceDate("2026-02", 31)).toBe("2026-02-28");
    expect(occurrenceDate("2028-02", 31)).toBe("2028-02-29");
    expect(occurrenceDate("2026-09", 31)).toBe("2026-09-30");
    expect(occurrenceDate("2026-10", 31)).toBe("2026-10-31");
    expect(occurrenceDate("2026-10", 1)).toBe("2026-10-01");
  });
});

describe("nextMonth", () => {
  it("rolls the year", () => {
    expect(nextMonth("2026-12")).toBe("2027-01");
    expect(nextMonth("2026-09")).toBe("2026-10");
  });
});

describe("recurringDue", () => {
  it("catches up every month from start to today", () => {
    expect(recurringDue(rule(), "2026-09-27")).toEqual({
      dates: ["2026-08-05", "2026-09-05"],
      lastGeneratedMonth: "2026-09",
    });
  });

  it("returns nothing once the current month is generated (idempotent)", () => {
    expect(recurringDue(rule({ last_generated_month: "2026-09" }), "2026-09-27")).toEqual({
      dates: [],
      lastGeneratedMonth: "2026-09",
    });
  });

  it("skips this month's occurrence until its day arrives", () => {
    expect(
      recurringDue(rule({ day_of_month: 28, last_generated_month: "2026-08" }), "2026-09-27")
    ).toEqual({ dates: [], lastGeneratedMonth: "2026-08" });
    expect(
      recurringDue(rule({ day_of_month: 28, last_generated_month: "2026-08" }), "2026-09-28").dates
    ).toEqual(["2026-09-28"]);
  });

  it("catches up across a year boundary", () => {
    expect(
      recurringDue(rule({ day_of_month: 25, last_generated_month: "2026-11" }), "2027-02-26").dates
    ).toEqual(["2026-12-25", "2027-01-25", "2027-02-25"]);
  });

  it("skips an occurrence before the start date in the start month", () => {
    expect(recurringDue(rule({ day_of_month: 5, start_date: "2026-09-10" }), "2026-10-06").dates)
      .toEqual(["2026-10-05"]);
  });

  it("uses the clamped date for day 31", () => {
    expect(
      recurringDue(rule({ day_of_month: 31, start_date: "2026-02-01" }), "2026-03-01").dates
    ).toEqual(["2026-02-28"]);
  });

  it("does nothing for a future start or an inactive rule", () => {
    expect(recurringDue(rule({ start_date: "2026-12-01" }), "2026-09-27").dates).toEqual([]);
    expect(recurringDue(rule({ active: false }), "2026-09-27")).toEqual({
      dates: [],
      lastGeneratedMonth: null,
    });
  });
});

describe("nextOccurrence", () => {
  it("is later this month when the day hasn't come yet", () => {
    expect(nextOccurrence(rule({ day_of_month: 28 }), "2026-09-27")).toBe("2026-09-28");
  });
  it("is next month when this month's day has passed or is today", () => {
    expect(nextOccurrence(rule({ day_of_month: 5 }), "2026-09-27")).toBe("2026-10-05");
    expect(nextOccurrence(rule({ day_of_month: 27 }), "2026-09-27")).toBe("2026-10-27");
  });
  it("respects a future start date", () => {
    expect(nextOccurrence(rule({ start_date: "2026-12-10" }), "2026-09-27")).toBe("2027-01-05");
  });
  it("is null for inactive rules", () => {
    expect(nextOccurrence(rule({ active: false }), "2026-09-27")).toBeNull();
  });
});

describe("resumeLastMonth", () => {
  const paused = { day_of_month: 5, start_date: "2026-01-01", last_generated_month: "2026-05", active: true };

  it("skips occurrences that fell while the rule was paused", () => {
    const last = resumeLastMonth(paused, "2026-09-28");
    expect(last).toBe("2026-09");
    expect(recurringDue({ ...paused, last_generated_month: last }, "2026-09-28").dates).toEqual([]);
  });

  it("keeps this month's occurrence when it is still ahead", () => {
    const rule = { ...paused, day_of_month: 30 };
    const last = resumeLastMonth(rule, "2026-09-28");
    expect(last).toBe("2026-08");
    expect(recurringDue({ ...rule, last_generated_month: last }, "2026-09-30").dates).toEqual(["2026-09-30"]);
  });

  it("never moves last_generated_month backwards", () => {
    expect(resumeLastMonth({ ...paused, day_of_month: 30, last_generated_month: "2026-09" }, "2026-09-28")).toBe("2026-09");
    expect(resumeLastMonth({ ...paused, last_generated_month: null }, "2026-01-03")).toBe("2025-12");
  });
});
