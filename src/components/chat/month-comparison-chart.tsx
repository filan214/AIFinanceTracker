"use client";

import { useTranslations } from "next-intl";
import { useLocale, type Locale } from "@/i18n/locale-provider";
import { CATEGORY_COLOR, type CategoryKey } from "@/lib/mock-data";

export type MonthComparisonData = {
  monthA: { month: string; total: number };
  monthB: { month: string; total: number };
  totalChange: number;
  totalChangePercent: number | null;
  categories: {
    category_key: string;
    totalA: number;
    totalB: number;
    change: number;
    changePercent: number | null;
  }[];
};

const FALLBACK_COLOR = "#a1a1aa"; // zinc-400 for unknown keys
const EARLIER_COLOR = "#a1a1aa"; // zinc-400 — the earlier month
const LATER_COLOR = "#10b981"; // emerald-500 — the later month

function monthLabel(month: string, locale: Locale): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}

// Compact money for this card only: Rp 290K / Rp 1.7M / Rp 2.9B (≤1 decimal,
// no trailing ".0"). Kept local so other components' formatting is untouched.
function shortFmt(amount: number): string {
  const abs = Math.abs(amount);
  const unit = (n: number, suffix: string) => {
    const s = n.toFixed(1);
    return `Rp ${s.endsWith(".0") ? s.slice(0, -2) : s}${suffix}`;
  };
  if (abs >= 1_000_000_000) return unit(abs / 1_000_000_000, "B");
  if (abs >= 1_000_000) return unit(abs / 1_000_000, "M");
  if (abs >= 1_000) return unit(abs / 1_000, "K");
  return `Rp ${Math.round(abs)}`;
}

// Round to at most 3 significant figures (used to cap huge multipliers).
function sig3(n: number): number {
  if (!isFinite(n) || n === 0) return 0;
  const digits = Math.floor(Math.log10(Math.abs(n))) + 1;
  const factor = Math.pow(10, 3 - digits);
  return Math.round(n * factor) / factor;
}

// Spending up between the two months is unfavourable (rose); down is
// favourable (emerald). `pct === null` is a brand-new category.
// >999% swings collapse to a multiple (e.g. ↑16×); >100% drop the decimal.
function changeParts(
  change: number,
  pct: number | null,
  newLabel: string
): { tone: string; text: string } {
  if (change === 0) return { tone: "text-zinc-400", text: "—" };
  const up = change > 0;
  const tone = up
    ? "text-rose-500 dark:text-rose-400"
    : "text-emerald-600 dark:text-emerald-400";
  let body: string;
  if (pct === null) {
    body = newLabel;
  } else {
    const a = Math.abs(pct);
    if (a > 999) body = `${sig3(Math.round(1 + a / 100))}×`;
    else if (a > 100) body = `${Math.round(a)}%`;
    else body = `${a}%`;
  }
  return { tone, text: `${up ? "↑" : "↓"}${body}` };
}

function Bar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  return (
    <span className="block h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
      <span
        className="block h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.round((value / max) * 100)}%`, background: color }}
      />
    </span>
  );
}

export function MonthComparisonChart({ data }: { data: MonthComparisonData }) {
  const { locale } = useLocale();
  const tChat = useTranslations("chat");
  const tCat = useTranslations("categories");

  const { monthA, monthB, totalChange, totalChangePercent, categories } = data;
  const rows = categories.slice(0, 6);
  if (rows.length === 0 && monthA.total === 0 && monthB.total === 0) return null;

  const labelA = monthLabel(monthA.month, locale);
  const labelB = monthLabel(monthB.month, locale);
  // The two headline totals share one scale — that comparison IS absolute.
  const totalMax = Math.max(monthA.total, monthB.total, 1);

  const known = (key: string): key is CategoryKey => key in CATEGORY_COLOR;
  const label = (key: string) => (known(key) ? tCat(key) : key);
  const catColor = (key: string) =>
    known(key) ? CATEGORY_COLOR[key] : FALLBACK_COLOR;

  const headline = changeParts(
    totalChange,
    totalChangePercent,
    tChat("compareNew")
  );

  const totalRows = [
    { lbl: labelA, total: monthA.total, color: EARLIER_COLOR },
    { lbl: labelB, total: monthB.total, color: LATER_COLOR },
  ];

  return (
    <div className="ml-9 max-w-md rounded-xl border border-zinc-200 bg-white p-4 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h4 className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">
          {tChat("compareTitle")}
        </h4>
        <span
          className={`font-mono text-[11px] font-semibold tabular-nums ${headline.tone}`}
        >
          {headline.text}
        </span>
      </div>

      {/* Headline — total spending for each month, shared scale */}
      <div className="mb-4 space-y-2">
        {totalRows.map((row) => (
          <div key={row.lbl} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: row.color }}
                />
                {row.lbl}
              </span>
              <span className="font-mono font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                {shortFmt(row.total)}
              </span>
            </div>
            <Bar value={row.total} max={totalMax} color={row.color} />
          </div>
        ))}
      </div>

      {/* Per-category — each row scaled to its own larger month (relative) */}
      {rows.length > 0 && (
        <>
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <p className="text-[11px] font-medium text-zinc-400">
              {tChat("compareByCategory")}
            </p>
            <span className="text-[10px] text-zinc-300 dark:text-zinc-600">
              {tChat("comparePerCategory")}
            </span>
          </div>
          <div className="space-y-2.5">
            {rows.map((c) => {
              const cp = changeParts(c.change, c.changePercent, tChat("compareNew"));
              // Relative scale: each row's larger month is 100% so the A-vs-B
              // comparison stays visible regardless of the category's size.
              const rowMax = Math.max(c.totalA, c.totalB, 1);
              return (
                <div key={c.category_key} className="space-y-1">
                  <div className="flex items-center gap-2 text-[12px]">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded"
                      style={{ background: catColor(c.category_key) }}
                    />
                    <span className="flex-1 truncate text-zinc-600 dark:text-zinc-300">
                      {label(c.category_key)}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-zinc-400">
                      {shortFmt(c.totalA)} → {shortFmt(c.totalB)}
                    </span>
                    <span
                      className={`w-11 text-right font-mono text-[10px] tabular-nums ${cp.tone}`}
                    >
                      {cp.text}
                    </span>
                  </div>
                  <div className="ml-[18px] space-y-1">
                    <Bar value={c.totalA} max={rowMax} color={EARLIER_COLOR} />
                    <Bar value={c.totalB} max={rowMax} color={LATER_COLOR} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
