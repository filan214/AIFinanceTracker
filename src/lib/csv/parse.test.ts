import { describe, it, expect } from "vitest";
import { detectDelimiter, parseCsv } from "./parse";

describe("detectDelimiter", () => {
  it("picks the most frequent delimiter outside quotes", () => {
    expect(detectDelimiter("a,b,c")).toBe(",");
    expect(detectDelimiter("Tanggal;Keterangan;Jumlah")).toBe(";");
    expect(detectDelimiter("a\tb\tc")).toBe("\t");
    expect(detectDelimiter('"a;b;c",d')).toBe(",");
    expect(detectDelimiter("single")).toBe(",");
  });
});

describe("parseCsv", () => {
  it("parses comma CSV with CRLF and a BOM", () => {
    expect(parseCsv("﻿Date,Desc,Amount\r\n2026-09-01,Kopi,25000\r\n")).toEqual([
      ["Date", "Desc", "Amount"],
      ["2026-09-01", "Kopi", "25000"],
    ]);
  });

  it("parses semicolon CSV with Indonesian decimals", () => {
    expect(parseCsv("Tanggal;Keterangan;Jumlah\n01/09/2026;Kopi;25.000,00")).toEqual([
      ["Tanggal", "Keterangan", "Jumlah"],
      ["01/09/2026", "Kopi", "25.000,00"],
    ]);
  });

  it("handles quoted fields with delimiters, escaped quotes, and newlines", () => {
    expect(parseCsv('a,b\n"Makan, minum","He said ""hi"""\n"line1\nline2",x')).toEqual([
      ["a", "b"],
      ["Makan, minum", 'He said "hi"'],
      ["line1\nline2", "x"],
    ]);
  });

  it("drops blank lines and returns [] for empty input", () => {
    expect(parseCsv("a,b\n\n , \n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("\n\n")).toEqual([]);
  });
});
