"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "@/i18n/locale-provider";
import { CATEGORY_COLOR, type CategoryKey } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

export type CategoryBreakdownItem = {
  category_key: string;
  total: number;
  count: number;
  percentage: number;
};

const FALLBACK_COLOR = "#a1a1aa"; // zinc-400 for unknown keys (e.g. "uncategorized")

export function CategoryBreakdownChart({
  breakdown,
  total,
}: {
  breakdown: CategoryBreakdownItem[];
  total: number;
}) {
  const { locale } = useLocale();
  const tChat = useTranslations("chat");
  const tCat = useTranslations("categories");

  const rows = breakdown.slice(0, 6);
  if (rows.length === 0) return null;

  const max = Math.max(...rows.map((r) => r.total), 1);
  const known = (key: string): key is CategoryKey => key in CATEGORY_COLOR;
  const label = (key: string) => (known(key) ? tCat(key) : key);
  const color = (key: string) => (known(key) ? CATEGORY_COLOR[key] : FALLBACK_COLOR);

  return (
    <div className="ml-9 max-w-md rounded-xl border border-zinc-200 bg-white p-4 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h4 className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">
          {tChat("chartCategoryTitle")}
        </h4>
        <span className="font-mono text-[11px] font-medium tabular-nums text-zinc-400">
          {formatCurrency(total, locale)}
        </span>
      </div>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.category_key} className="space-y-1">
            <div className="flex items-center gap-2 text-[12px]">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded"
                style={{ background: color(r.category_key) }}
              />
              <span
                className={`flex-1 truncate ${
                  i === 0
                    ? "font-semibold text-zinc-800 dark:text-zinc-100"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {label(r.category_key)}
              </span>
              <span className="font-mono text-[11px] font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatCurrency(r.total, locale)}
              </span>
              <span className="w-10 text-right font-mono text-[10px] tabular-nums text-zinc-400">
                {r.percentage}%
              </span>
            </div>
            <span className="ml-[18px] block h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <span
                className="block h-full rounded-full transition-[width] duration-700"
                style={{
                  width: `${Math.round((r.total / max) * 100)}%`,
                  background: color(r.category_key),
                }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
