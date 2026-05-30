"use client";

import { PieChart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/i18n/locale-provider";
import { formatCompactCurrency } from "@/lib/format";
import { CATEGORY_COLOR, type CategoryKey } from "@/lib/mock-data";
import type { ReportCategory } from "@/types/report";
import { ReportCard } from "./card";

const FALLBACK_COLOR = "#a1a1aa";

// SVG donut built from stroke-dasharray arcs — no chart dependency.
function Donut({ segments }: { segments: { value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 60;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 160 160" className="h-[140px] w-[140px] shrink-0" role="img">
      <g transform="rotate(-90 80 80)">
        <circle cx={80} cy={80} r={r} fill="none" strokeWidth={20} className="stroke-zinc-100 dark:stroke-zinc-800" />
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const el = (
            <circle
              key={i}
              cx={80}
              cy={80}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={20}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </g>
    </svg>
  );
}

export function CategoryBreakdown({
  categories,
}: {
  categories: ReportCategory[];
}) {
  const t = useTranslations("reports");
  const tCat = useTranslations("categories");
  const { locale } = useLocale();

  const top = categories.slice(0, 6);
  const color = (key: string) =>
    key in CATEGORY_COLOR ? CATEGORY_COLOR[key as CategoryKey] : FALLBACK_COLOR;
  const label = (key: string) =>
    key in CATEGORY_COLOR ? tCat(key as CategoryKey) : key;

  return (
    <ReportCard icon={PieChart} title={t("categoryBreakdown")}>
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <Donut
          segments={top.map((c) => ({ value: c.total, color: color(c.categoryKey) }))}
        />
        <ul className="w-full flex-1 space-y-2.5">
          {top.map((c) => (
            <li key={c.categoryKey} className="flex items-center gap-2 text-[13px]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded"
                style={{ background: color(c.categoryKey) }}
              />
              <span className="flex-1 truncate text-zinc-600 dark:text-zinc-300">
                {label(c.categoryKey)}
              </span>
              <span
                className={
                  "font-medium tabular-nums " +
                  (c.vsLastMonth > 0
                    ? "text-rose-500 dark:text-rose-400"
                    : c.vsLastMonth < 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400")
                }
              >
                {c.vsLastMonth === 0 ? "—" : `${c.vsLastMonth > 0 ? "↑" : "↓"}${Math.abs(c.vsLastMonth)}%`}
              </span>
              <span className="w-20 text-right font-mono text-[12px] font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatCompactCurrency(c.total, locale)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ReportCard>
  );
}
