import { addDays } from "./ymd";
import type { Draft } from "./draft";

const INCOME_WORDS = /\b(gaji|salary|income|bonus|freelance|refund|dapat|terima)\b/i;
const YESTERDAY = /\b(kemarin|yesterday)\b/i;
const TODAY = /\b(hari ini|today)\b/i;
const SUFFIX = /(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta|m)\b/i;
const RP = /rp\.?\s*(\d[\d.,]*)/i;
const PLAIN = /\d[\d.,]*/g;

// "12.000" / "12,000" / "12.000,50" → 12000. Rupiah has no minor unit in
// practice, so a trailing 1–2 digit group after the last separator is dropped.
export function parseRupiahNumber(raw: string): number | null {
  const s = raw.replace(/[^\d.,]/g, "");
  if (!/\d/.test(s)) return null;
  const decimal = s.match(/[.,](\d{1,2})$/);
  const intPart = decimal ? s.slice(0, decimal.index) : s;
  const n = Number(intPart.replace(/[.,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// Rule-based parse of a short note like "makan siang 35rb kemarin". Runs
// before (and as the fallback for) the AI parse, so it must never throw.
export function quickParse(text: string, today: string): Draft {
  let rest = ` ${text} `;
  let amount = 0;

  const suffix = rest.match(SUFFIX);
  if (suffix) {
    const base = Number(suffix[1].replace(",", "."));
    const unit = suffix[2].toLowerCase();
    const mult = unit === "rb" || unit === "ribu" || unit === "k" ? 1_000 : 1_000_000;
    amount = Math.round(base * mult);
    rest = rest.replace(suffix[0], " ");
  } else {
    const rp = rest.match(RP);
    if (rp) {
      amount = parseRupiahNumber(rp[1]) ?? 0;
      rest = rest.replace(rp[0], " ");
    } else {
      let best = "";
      for (const n of rest.match(PLAIN) ?? []) {
        const v = parseRupiahNumber(n) ?? 0;
        if (v > amount) {
          amount = v;
          best = n;
        }
      }
      if (best) rest = rest.replace(best, " ");
    }
  }

  let date = today;
  if (YESTERDAY.test(rest)) {
    date = addDays(today, -1);
    rest = rest.replace(YESTERDAY, " ");
  } else if (TODAY.test(rest)) {
    rest = rest.replace(TODAY, " ");
  }

  const type = INCOME_WORDS.test(text) ? "income" : "expense";
  const cleaned = rest
    .replace(/\s+/g, " ")
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, "")
    .trim();
  const description = cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : "";

  return {
    amount,
    type,
    description,
    date,
    category_key: type === "income" ? "income" : "shopping",
  };
}
