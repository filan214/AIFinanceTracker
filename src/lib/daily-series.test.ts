import { describe, it, expect } from "vitest";
import { dailySeries } from "./daily-series";

const data = [
  { day: "2026-10-01", total: 750000 },
  { day: "2026-10-05", total: 168977 },
];

describe("dailySeries", () => {
  it("fills every day of the current month up to today, zero where nothing was spent", () => {
    expect(dailySeries(data, { monthKey: "2026-10", range: "month", today: "2026-10-06" })).toEqual([
      { day: "2026-10-01", total: 750000 },
      { day: "2026-10-02", total: 0 },
      { day: "2026-10-03", total: 0 },
      { day: "2026-10-04", total: 0 },
      { day: "2026-10-05", total: 168977 },
      { day: "2026-10-06", total: 0 },
    ]);
  });

  it("keeps the last 7 days, clipped to the start of the month", () => {
    const out = dailySeries(data, { monthKey: "2026-10", range: "7d", today: "2026-10-06" });
    expect(out.map((d) => d.day)).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
      "2026-10-05",
      "2026-10-06",
    ]);
  });

  it("runs a past month through its last day", () => {
    const sep = [{ day: "2026-09-28", total: 50000 }];
    const month = dailySeries(sep, { monthKey: "2026-09", range: "month", today: "2026-10-06" });
    expect(month).toHaveLength(30);
    expect(month[0]).toEqual({ day: "2026-09-01", total: 0 });
    expect(month[27]).toEqual({ day: "2026-09-28", total: 50000 });
    expect(month[29]).toEqual({ day: "2026-09-30", total: 0 });

    const week = dailySeries(sep, { monthKey: "2026-09", range: "7d", today: "2026-10-06" });
    expect(week.map((d) => d.day)).toEqual([
      "2026-09-24",
      "2026-09-25",
      "2026-09-26",
      "2026-09-27",
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
    ]);
  });

  it("returns nothing for a month that hasn't started", () => {
    expect(dailySeries([], { monthKey: "2026-11", range: "month", today: "2026-10-06" })).toEqual([]);
  });

  it("handles a leap-year February", () => {
    expect(dailySeries([], { monthKey: "2028-02", range: "month", today: "2028-03-10" })).toHaveLength(29);
  });
});
