"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocale } from "@/i18n/locale-provider";
import { formatCurrency } from "@/lib/format";
import { dailySeries, type DailyRange } from "@/lib/daily-series";
import { localToday } from "@/lib/ymd";
import { TOOLTIP_PROPS } from "@/lib/chart-theme";

// The dashboard only loads the selected month, so the ranges are "last 7 days"
// and "whole month"; a 30 or 90 day button would show the same chart.
const RANGES: DailyRange[] = ["7d", "month"];

export function DailyLine({
  data,
  monthKey,
}: {
  data: { day: string; total: number }[];
  monthKey: string;
}) {
  const { locale } = useLocale();
  const t = useTranslations("dashboard");
  const [range, setRange] = useState<DailyRange>("month");
  const tag = locale === "id" ? "id-ID" : "en-US";

  const series = dailySeries(data, { monthKey, range, today: localToday() });
  const chartData = series.map((d) => ({ day: d.day, label: d.day.slice(-2), total: d.total }));
  const hasSpending = series.some((d) => d.total > 0);

  const [y, m] = monthKey.split("-").map(Number);
  const monthLabel = new Intl.DateTimeFormat(tag, { month: "long", year: "numeric" }).format(
    new Date(y, m - 1, 1)
  );
  const dayLabel = (ymd: string) =>
    new Intl.DateTimeFormat(tag, { day: "numeric", month: "short", timeZone: "UTC" }).format(
      new Date(`${ymd}T00:00:00Z`)
    );

  return (
    <div className="animate-slide-up rounded-xl border border-zinc-200 bg-white p-5 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-semibold">{t("dailyTrend")}</h3>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {range === "7d" ? t("last7Days") : monthLabel}
          </p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={r === range}
              className={
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors [@media(hover:none)]:min-h-11 [@media(hover:none)]:min-w-11 " +
                (r === range
                  ? "border border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200")
              }
            >
              {r === "7d" ? t("range7d") : t("rangeMonth")}
            </button>
          ))}
        </div>
      </div>
      {hasSpending ? (
        <div className="mt-4 h-[200px] w-full">
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--bg-soft)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="var(--ink-3)"
                fontSize={10}
                fontFamily="var(--font-mono)"
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                stroke="var(--ink-3)"
                fontSize={10}
                fontFamily="var(--font-mono)"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                {...TOOLTIP_PROPS}
                formatter={(value: number) => [
                  formatCurrency(value, locale),
                  locale === "id" ? "Pengeluaran" : "Spent",
                ]}
                labelFormatter={(_, payload) => {
                  const day = payload?.[0]?.payload?.day;
                  return day ? dayLabel(day) : "";
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={2.4}
                fill="url(#lineFill)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4 flex h-[200px] items-center justify-center rounded-lg bg-zinc-50 text-[13px] text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400">
          {t("trendEmpty")}
        </div>
      )}
    </div>
  );
}
