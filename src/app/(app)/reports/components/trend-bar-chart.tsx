"use client";

import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/i18n/locale-provider";
import { formatCompactCurrency } from "@/lib/format";
import type { ReportTrendPoint } from "@/types/report";
import { cn } from "@/lib/cn";
import { ReportCard } from "./card";

// Bar chart for the 6-month spend trend; the report month is emphasized.
// Built from HTML boxes rather than a scaled SVG so the labels keep a fixed
// size at every card width.
export function TrendBarChart({
  trend,
  currentMonth,
}: {
  trend: ReportTrendPoint[];
  currentMonth: string;
}) {
  const t = useTranslations("reports");
  const { locale } = useLocale();

  const max = Math.max(...trend.map((p) => p.totalSpent), 1);

  const shortMonth = (key: string) => {
    const [yy, mm] = key.split("-").map(Number);
    return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
      month: "short",
    }).format(new Date(yy, mm - 1, 1));
  };

  return (
    <ReportCard icon={BarChart3} title={t("sixMonthTrend")}>
      <div className="flex h-52 gap-2 pt-5 sm:gap-3">
        {trend.map((p) => {
          const isCurrent = p.month === currentMonth;
          const pct = p.totalSpent > 0 ? Math.max((p.totalSpent / max) * 100, 2) : 0;
          return (
            <div key={p.month} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className={cn(
                    "relative w-full max-w-10 rounded-t-[3px]",
                    isCurrent ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-700"
                  )}
                  style={{ height: `${pct}%` }}
                >
                  {p.totalSpent > 0 && (
                    <span
                      className={cn(
                        "absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] tabular-nums",
                        isCurrent
                          ? "font-semibold text-zinc-800 dark:text-zinc-100"
                          : "text-zinc-500 dark:text-zinc-400"
                      )}
                    >
                      {formatCompactCurrency(p.totalSpent, locale).replace(/^Rp\s/, "")}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  "mt-1.5 text-[11px]",
                  isCurrent
                    ? "font-medium text-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 dark:text-zinc-400"
                )}
              >
                {shortMonth(p.month)}
              </span>
            </div>
          );
        })}
      </div>
    </ReportCard>
  );
}
