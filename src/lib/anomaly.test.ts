import { describe, it, expect } from "vitest";
import {
  weekIndex,
  filterTriggeredTransactions,
  hasSpendingSpike,
  markNewTransactions,
} from "./anomaly";

describe("hasSpendingSpike", () => {
  it("is false when no category rose more than 20% over its 3-week average", () => {
    expect(
      hasSpendingSpike({
        week_0: { food: 110000, transport: 50000 },
        week_1: { food: 100000, transport: 60000 },
        week_2: { food: 100000, transport: 50000 },
        week_3: { food: 100000, transport: 40000 },
      })
    ).toBe(false);
  });

  it("is true when a category rose more than 20% over its 3-week average", () => {
    expect(
      hasSpendingSpike({
        week_0: { entertainment: 327000 },
        week_1: { entertainment: 230000 },
        week_2: { entertainment: 230000 },
        week_3: { entertainment: 230000 },
      })
    ).toBe(true);
  });

  it("counts a missing week as zero spend in the average", () => {
    // typical = (100000 + 0 + 0) / 3 ≈ 33333, so 50000 is a spike.
    expect(hasSpendingSpike({ week_0: { food: 50000 }, week_1: { food: 100000 } })).toBe(true);
  });

  it("treats spend in a category never seen before as a spike", () => {
    expect(
      hasSpendingSpike({ week_0: { health: 20000 }, week_1: { food: 100000 } })
    ).toBe(true);
  });

  it("is false when there's no spending this week", () => {
    expect(hasSpendingSpike({ week_1: { food: 100000 } })).toBe(false);
  });
});

describe("markNewTransactions", () => {
  it("sets isNew from the stored description, not the model's copy", () => {
    const txns = [
      { id: "1", description: "Netflix" },
      { id: "2", description: "Kopi" },
    ];
    expect(
      markNewTransactions(
        [
          { id: "1", description: "netflix sub", amount: 65000, isNew: false },
          { id: "2", description: "Kopi", amount: 20000, isNew: true },
        ],
        txns,
        new Set(["Kopi"])
      )
    ).toEqual([
      { id: "1", description: "netflix sub", amount: 65000, isNew: true },
      { id: "2", description: "Kopi", amount: 20000, isNew: false },
    ]);
  });

  it("tolerates a model reply without isNew", () => {
    const out = markNewTransactions(
      [{ id: "1", description: "Netflix", amount: 65000 } as never],
      [{ id: "1", description: "Netflix" }],
      new Set()
    );
    expect(out[0].isNew).toBe(true);
  });
});

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

describe("filterTriggeredTransactions", () => {
  const txns = [
    { id: "1", category_key: "shopping" },
    { id: "2", category_key: "savings" },
    { id: "3", category_key: "shopping" },
  ];

  it("drops a transaction whose real category doesn't match the flagged one", () => {
    // The model hallucinated a "savings" row into a "shopping" spike.
    expect(
      filterTriggeredTransactions(
        [
          { id: "1", description: "Casing HP", amount: 100000, isNew: true },
          { id: "2", description: "Laptop baru", amount: 500000, isNew: true },
        ],
        "shopping",
        txns
      )
    ).toEqual([{ id: "1", description: "Casing HP", amount: 100000, isNew: true }]);
  });

  it("drops a transaction id the model made up", () => {
    expect(
      filterTriggeredTransactions(
        [{ id: "does-not-exist", description: "Ghost", amount: 1, isNew: true }],
        "shopping",
        txns
      )
    ).toEqual([]);
  });

  it("keeps every transaction when they all match", () => {
    const triggered = [
      { id: "1", description: "Casing HP", amount: 100000, isNew: true },
      { id: "3", description: "Sepatu", amount: 250000, isNew: false },
    ];
    expect(filterTriggeredTransactions(triggered, "shopping", txns)).toEqual(triggered);
  });
});
