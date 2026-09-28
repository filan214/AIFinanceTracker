import { describe, it, expect } from "vitest";
import { weekIndex, filterTriggeredTransactions } from "./anomaly";

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
