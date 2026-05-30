"use client";

import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/i18n/locale-provider";
import { formatCompactCurrency } from "@/lib/format";
import type { ReportTrendPoint } from "@/types/report";
import { ReportCard } from "./card";

// SVG bar chart for the 6-month spend trend; the report month is emphasized.
export function TrendBarChart({
  trend,
  currentMonth,
}: {
  trend: ReportTrendPoint[];
  currentMonth: string;
}) {
  const t = useTranslations("reports");
  const { locale } = useLocale();

  const W = 320;
  const H = 170;
  const padTop = 22;
  const padBottom = 22;
  const max = Math.max(...trend.map((p) => p.totalSpent), 1);
  const n = trend.length;
  const slot = W / n;
  const barW = slot * 0.5;
  const innerH = H - padTop - padBottom;

  const shortMonth = (key: string) => {
    const [yy, mm] = key.split("-").map(Number);
    return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
      month: "short",
    }).format(new Date(yy, mm - 1, 1));
  };

  return (
    <ReportCard icon={BarChart3} title={t("sixMonthTrend")}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        {trend.map((p, i) => {
          const h = Math.max((p.totalSpent / max) * innerH, p.totalSpent > 0 ? 3 : 0);
          const x = i * slot + (slot - barW) / 2;
          const y = padTop + (innerH - h);
          const isCurrent = p.month === currentMonth;
          return (
            <g key={p.month}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={3}
                className={
                  isCurrent
                    ? "fill-zinc-900 dark:fill-zinc-100"
                    : "fill-zinc-200 dark:fill-zinc-700"
                }
              />
              <text
                x={x + barW / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="9"
                className={
                  isCurrent
                    ? "fill-zinc-700 font-semibold dark:fill-zinc-200"
                    : "fill-zinc-400"
                }
              >
                {p.totalSpent > 0 ? formatCompactCurrency(p.totalSpent, locale).replace(/^Rp\s/, "") : ""}
              </text>
              <text
                x={x + barW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize="10"
                className={isCurrent ? "fill-zinc-600 dark:fill-zinc-300" : "fill-zinc-400"}
              >
                {shortMonth(p.month)}
              </text>
            </g>
          );
        })}
      </svg>
    </ReportCard>
  );
}
