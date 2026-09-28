import { describe, it, expect } from "vitest";
import {
  parseAmount,
  parseDate,
  guessDateFormat,
  guessMapping,
  rowsToDrafts,
  findDuplicates,
} from "./map";

describe("parseAmount", () => {
  it("parses ID and EN number formats", () => {
    expect(parseAmount("1.234.567,00")).toEqual({ value: 1234567, dir: null });
    expect(parseAmount("1,234,567.00")).toEqual({ value: 1234567, dir: null });
    expect(parseAmount("25.000")).toEqual({ value: 25000, dir: null });
    expect(parseAmount("12,50")).toEqual({ value: 13, dir: null });
    expect(parseAmount("Rp 50.000")).toEqual({ value: 50000, dir: null });
  });
  it("reads direction from sign, parentheses, and CR/DB markers", () => {
    expect(parseAmount("-25000")).toEqual({ value: 25000, dir: "out" });
    expect(parseAmount("(25.000)")).toEqual({ value: 25000, dir: "out" });
    expect(parseAmount("+25000")).toEqual({ value: 25000, dir: "in" });
    expect(parseAmount("150,000.00 DB")).toEqual({ value: 150000, dir: "out" });
    expect(parseAmount("8,500,000.00 CR")).toEqual({ value: 8500000, dir: "in" });
  });
  it("rejects non-numbers", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("01/09/2026")).toBeNull();
    expect(parseAmount("1.2.3")).toBeNull();
  });
});

describe("parseDate", () => {
  it("parses each format and validates the result", () => {
    expect(parseDate("01/09/2026", "dmy")).toBe("2026-09-01");
    expect(parseDate("09/01/2026", "mdy")).toBe("2026-09-01");
    expect(parseDate("2026-09-01", "ymd")).toBe("2026-09-01");
    expect(parseDate("1-9-26", "dmy")).toBe("2026-09-01");
    expect(parseDate("2026-09-01 10:22:00", "ymd")).toBe("2026-09-01");
    expect(parseDate("31/02/2026", "dmy")).toBeNull();
    expect(parseDate("hello", "dmy")).toBeNull();
  });
});

describe("guessDateFormat", () => {
  it("detects ymd, mdy, and defaults to dmy", () => {
    expect(guessDateFormat(["2026-09-01"])).toBe("ymd");
    expect(guessDateFormat(["09/25/2026", "09/01/2026"])).toBe("mdy");
    expect(guessDateFormat(["25/09/2026"])).toBe("dmy");
    expect(guessDateFormat(["01/02/2026"])).toBe("dmy");
    expect(guessDateFormat([])).toBe("dmy");
  });
});

describe("guessMapping", () => {
  it("maps Indonesian headers", () => {
    expect(guessMapping(["Tanggal", "Keterangan", "Cabang", "Jumlah"], [])).toEqual({
      date: 0,
      description: 1,
      amount: 3,
      debit: null,
      credit: null,
      type: null,
    });
  });
  it("maps English debit/credit headers without confusing 'Description' with CR", () => {
    expect(
      guessMapping(["Transaction Date", "Transaction Description", "Debit", "Credit", "Balance"], [])
    ).toEqual({ date: 0, description: 1, amount: null, debit: 2, credit: 3, type: null });
  });
  it("falls back to value patterns for unknown headers", () => {
    expect(
      guessMapping(
        ["A", "B", "C"],
        [
          ["01/09/2026", "Kopi susu", "25.000"],
          ["02/09/2026", "Nasi padang", "45.000"],
        ]
      )
    ).toEqual({ date: 0, description: 1, amount: 2, debit: null, credit: null, type: null });
  });
  it("maps a type column instead of reading 'Cr/Dr' as credit", () => {
    expect(guessMapping(["Date", "Description", "Amount", "Cr/Dr"], [])).toEqual({
      date: 0,
      description: 1,
      amount: 2,
      debit: null,
      credit: null,
      type: 3,
    });
    expect(guessMapping(["Tanggal", "Keterangan", "Mutasi", "Tipe"], []).type).toBe(3);
  });
});

describe("rowsToDrafts", () => {
  const mapping = { date: 0, description: 1, amount: 2, debit: null, credit: null, type: null };

  it("treats unsigned amounts as expenses when nothing marks direction", () => {
    const [r] = rowsToDrafts([["01/09/2026", "Kopi", "25.000"]], mapping, "dmy");
    expect(r).toEqual({
      index: 0,
      date: "2026-09-01",
      description: "Kopi",
      amount: 25000,
      type: "expense",
      error: null,
    });
  });

  it("treats unsigned amounts as income when the file uses minus for expenses", () => {
    const out = rowsToDrafts(
      [
        ["01/09/2026", "Kopi", "-25000"],
        ["25/09/2026", "Gaji", "8500000"],
      ],
      mapping,
      "dmy"
    );
    expect(out.map((r) => r.type)).toEqual(["expense", "income"]);
  });

  it("uses debit/credit columns", () => {
    const out = rowsToDrafts(
      [
        ["01/09/2026", "Kopi", "25000", ""],
        ["25/09/2026", "Gaji", "", "8500000"],
      ],
      { date: 0, description: 1, amount: null, debit: 2, credit: 3, type: null },
      "dmy"
    );
    expect(out.map((r) => [r.type, r.amount])).toEqual([
      ["expense", 25000],
      ["income", 8500000],
    ]);
  });

  it("reads direction from a type column", () => {
    const out = rowsToDrafts(
      [
        ["01/09/2026", "Kopi", "25.000", "D"],
        ["25/09/2026", "Gaji", "8.500.000", "K"],
        ["26/09/2026", "Transfer", "100.000", "CR"],
        ["27/09/2026", "Pulsa", "50.000", "DB"],
      ],
      { ...mapping, type: 3 },
      "dmy"
    );
    expect(out.map((r) => r.type)).toEqual(["expense", "income", "income", "expense"]);
  });

  it("flags invalid rows", () => {
    const out = rowsToDrafts(
      [
        ["xx", "Kopi", "25000"],
        ["01/09/2026", "Kopi", "abc"],
        ["01/09/2026", "", "25000"],
      ],
      mapping,
      "dmy"
    );
    expect(out.map((r) => r.error)).toEqual(["date", "amount", "description"]);
  });
});

describe("findDuplicates", () => {
  it("matches existing transactions by date, amount, and normalized description only", () => {
    const rows = rowsToDrafts(
      [
        ["01/09/2026", "Kopi  Susu", "25000"],
        ["01/09/2026", "Kopi Susu", "25000"],
        ["02/09/2026", "Kopi Susu", "25000"],
      ],
      { date: 0, description: 1, amount: 2, debit: null, credit: null, type: null },
      "dmy"
    );
    const dups = findDuplicates(rows, [{ date: "2026-09-01", amount: "25000", description: "kopi susu" }]);
    expect([...dups].sort()).toEqual([0, 1]);
  });
});
