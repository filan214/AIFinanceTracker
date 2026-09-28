import { isValidYmd } from "@/lib/ymd";

export type DateFormat = "dmy" | "mdy" | "ymd";

export type ColumnMapping = {
  date: number | null;
  description: number | null;
  amount: number | null;
  debit: number | null;
  credit: number | null;
  type: number | null; // indicator column: CR/DB, K/D, kredit/debit…
};

export type ParsedAmount = { value: number; dir: "in" | "out" | null };

export type CsvRow = {
  index: number;
  date: string | null;
  description: string;
  amount: number;
  type: "income" | "expense";
  error: "date" | "amount" | "description" | null;
};

// "1.234.567,00" (ID) and "1,234,567.00" (EN): when both separators appear the
// last one is the decimal mark; a lone separator followed by groups of exactly
// three digits is a thousands separator.
function parseLocaleNumber(s: string): number | null {
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  let normalized = s;
  if (lastDot >= 0 && lastComma >= 0) {
    const dec = lastDot > lastComma ? "." : ",";
    const thousands = dec === "." ? "," : ".";
    normalized = s.split(thousands).join("").replace(dec, ".");
  } else if (lastDot >= 0 || lastComma >= 0) {
    const sep = lastComma >= 0 ? "," : ".";
    const grouped = new RegExp(`^\\d{1,3}(\\${sep}\\d{3})+$`).test(s);
    normalized = grouped ? s.split(sep).join("") : s.replace(sep, ".");
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function parseAmount(raw: string): ParsedAmount | null {
  let s = raw.trim();
  if (!s) return null;
  let dir: ParsedAmount["dir"] = null;

  const marker = s.match(/\s*(CR|DB|DR)\.?$/i);
  if (marker) {
    dir = marker[1].toUpperCase() === "CR" ? "in" : "out";
    s = s.slice(0, marker.index).trim();
  }
  s = s.replace(/rp\.?/gi, "").trim();
  if (/^\(.*\)$/.test(s)) {
    dir = "out";
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith("-")) {
    dir = "out";
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    dir = "in";
    s = s.slice(1);
  }
  s = s.replace(/\s/g, "");
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null;

  const value = parseLocaleNumber(s);
  return value === null ? null : { value: Math.round(value), dir };
}

const DATE_RE = /^(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{1,4})/;

export function parseDate(raw: string, format: DateFormat): string | null {
  const m = raw.trim().match(DATE_RE);
  if (!m) return null;
  const [a, b, c] = [m[1], m[2], m[3]];
  let y: string, mo: string, d: string;
  if (format === "ymd") [y, mo, d] = [a, b, c];
  else if (format === "dmy") [d, mo, y] = [a, b, c];
  else [mo, d, y] = [a, b, c];
  if (y.length === 2) y = `20${y}`;
  if (y.length !== 4) return null;
  const out = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  return isValidYmd(out) ? out : null;
}

export function guessDateFormat(values: string[]): DateFormat {
  let firstOver12 = false;
  let secondOver12 = false;
  for (const v of values) {
    const m = v.trim().match(DATE_RE);
    if (!m) continue;
    if (m[1].length === 4) return "ymd";
    if (Number(m[1]) > 12) firstOver12 = true;
    if (Number(m[2]) > 12) secondOver12 = true;
  }
  return secondOver12 && !firstOver12 ? "mdy" : "dmy";
}

const KEYWORDS: Record<keyof ColumnMapping, string[]> = {
  date: ["tanggal", "tgl", "date"],
  description: ["keterangan", "deskripsi", "description", "uraian", "remark", "berita", "details"],
  amount: ["jumlah", "amount", "nominal", "mutasi", "nilai"],
  debit: ["debit", "debet", "db", "keluar", "withdrawal"],
  credit: ["kredit", "credit", "cr", "masuk", "deposit"],
  type: ["tipe", "type", "jenis", "d/k", "k/d", "d/c", "c/d", "db/cr", "cr/db", "dr/cr", "cr/dr", "debit/credit", "debet/kredit"],
};
// Type first so an indicator header like "Cr/Dr" isn't taken as the credit
// column; debit/credit before amount so "Debit Amount" maps to debit.
const ORDER: (keyof ColumnMapping)[] = ["date", "type", "debit", "credit", "amount", "description"];

const TYPE_IN = ["cr", "k", "c", "kredit", "credit", "masuk", "in", "income", "pemasukan", "+"];
const TYPE_OUT = ["db", "dr", "d", "debit", "debet", "keluar", "out", "expense", "pengeluaran", "-"];

function parseTypeValue(raw: string): ParsedAmount["dir"] {
  const v = raw.trim().toLowerCase().replace(/\.$/, "");
  if (TYPE_IN.includes(v)) return "in";
  if (TYPE_OUT.includes(v)) return "out";
  return null;
}

function headerMatches(header: string, keyword: string, exact: boolean): boolean {
  if (exact) return header === keyword;
  // Short keywords ("cr", "db", "tgl") must be whole words: "description" contains "cr".
  if (keyword.length <= 3) return header.split(/[^a-z]+/).includes(keyword);
  return header.includes(keyword);
}

export function guessMapping(headers: string[], rows: string[][]): ColumnMapping {
  const mapping: ColumnMapping = {
    date: null,
    description: null,
    amount: null,
    debit: null,
    credit: null,
    type: null,
  };
  const used = new Set<number>();
  const norm = headers.map((h) => h.toLowerCase().trim());

  for (const exact of [true, false]) {
    for (const field of ORDER) {
      if (mapping[field] !== null) continue;
      const idx = norm.findIndex(
        (h, i) => !used.has(i) && KEYWORDS[field].some((k) => headerMatches(h, k, exact))
      );
      if (idx >= 0) {
        mapping[field] = idx;
        used.add(idx);
      }
    }
  }

  // Fallback: infer from values in the first rows.
  const sample = rows.slice(0, 20);
  const share = (i: number, test: (v: string) => boolean) => {
    const vals = sample.map((r) => r[i] ?? "").filter((v) => v !== "");
    return vals.length ? vals.filter(test).length / vals.length : 0;
  };
  const free = () => headers.map((_, i) => i).filter((i) => !used.has(i));

  if (mapping.date === null) {
    const i = free().find((i) => share(i, (v) => parseDate(v, guessDateFormat([v])) !== null) >= 0.6);
    if (i !== undefined) {
      mapping.date = i;
      used.add(i);
    }
  }
  if (mapping.amount === null && mapping.debit === null && mapping.credit === null) {
    const i = free().find((i) => share(i, (v) => parseAmount(v) !== null) >= 0.6);
    if (i !== undefined) {
      mapping.amount = i;
      used.add(i);
    }
  }
  if (mapping.description === null) {
    let best = -1;
    let bestLen = 0;
    for (const i of free()) {
      const avg = sample.reduce((s, r) => s + (r[i]?.length ?? 0), 0) / Math.max(1, sample.length);
      if (share(i, (v) => parseAmount(v) === null) >= 0.6 && avg > bestLen) {
        best = i;
        bestLen = avg;
      }
    }
    if (best >= 0) mapping.description = best;
  }
  return mapping;
}

export function rowsToDrafts(rows: string[][], mapping: ColumnMapping, format: DateFormat): CsvRow[] {
  const cell = (r: string[], i: number | null) => (i === null ? "" : (r[i] ?? "").trim());
  const splitColumns = mapping.debit !== null || mapping.credit !== null;

  const parsed: (ParsedAmount | null)[] = rows.map((r) => {
    if (!splitColumns) {
      const p = parseAmount(cell(r, mapping.amount));
      const dir = mapping.type === null ? null : parseTypeValue(cell(r, mapping.type));
      return p && dir ? { value: p.value, dir } : p;
    }
    const out = parseAmount(cell(r, mapping.debit));
    if (out && out.value > 0) return { value: out.value, dir: "out" };
    const inn = parseAmount(cell(r, mapping.credit));
    if (inn && inn.value > 0) return { value: inn.value, dir: "in" };
    return null;
  });
  // Files that mark expenses with "-" leave income unsigned; files with no
  // direction markers at all are treated as expenses.
  const fileMarksOut = parsed.some((p) => p?.dir === "out");

  return rows.map((r, index) => {
    const p = parsed[index];
    const date = parseDate(cell(r, mapping.date), format);
    const description = cell(r, mapping.description).replace(/\s+/g, " ").slice(0, 120);
    const amount = p?.value ?? 0;
    const dir = p?.dir ?? (fileMarksOut ? "in" : "out");
    const error: CsvRow["error"] = !date
      ? "date"
      : !p || amount <= 0
        ? "amount"
        : !description
          ? "description"
          : null;
    return { index, date, description, amount, type: dir === "in" ? "income" : "expense", error };
  });
}

const dupKey = (date: string, amount: number, description: string) =>
  `${date}|${Math.round(amount)}|${description.toLowerCase().replace(/\s+/g, " ").trim()}`;

// Rows matching an already-saved transaction. Identical rows inside the file are
// NOT flagged — two identical coffees on one day are normal bank statement lines.
export function findDuplicates(
  rows: CsvRow[],
  existing: { date: string; amount: number | string; description: string }[]
): Set<number> {
  const seen = new Set(existing.map((e) => dupKey(e.date, Number(e.amount), e.description)));
  const dups = new Set<number>();
  for (const r of rows) {
    if (r.date && seen.has(dupKey(r.date, r.amount, r.description))) dups.add(r.index);
  }
  return dups;
}
