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

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

// `data` is sorted ascending by day. Keep the last `range` calendar days,
// anchored to the most recent day present so it also works for past months.
function filterByRange(
  data: { day: string; total: number }[],
  range: Range
): { day: string; total: number }[] {
  if (data.length === 0) return data;
  const last = data[data.length - 1].day;
  const cutoff = new Date(`${last}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - (range - 1));
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return data.filter((d) => d.day >= cutoffStr);
}

export function DailyLine({
  data,
}: {
  data: { day: string; total: number }[];
}) {
  const { locale } = useLocale();
  const t = useTranslations("dashboard");
  const [range, setRange] = useState<Range>(30);

  const chartData = filterByRange(data, range).map((d) => ({
    label: d.day.slice(-2),
    total: d.total,
  }));

  return (
    <div className="animate-slide-up rounded-xl border border-zinc-200 bg-white p-5 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1 flex items-start justify-between">
        <div>
          <h3 className="text-[13px] font-semibold">{t("dailyTrend")}</h3>
          <p className="text-[11px] text-zinc-400">
            {locale === "id" ? `${range} hari terakhir` : `Last ${range} days`}
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
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors " +
                (r === range
                  ? "border border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300")
              }
            >
              {r}D
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-[200px] w-full">
        <ResponsiveContainer>
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--bg-soft)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="var(--ink-5)"
              fontSize={10}
              fontFamily="var(--font-mono)"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--ink-5)"
              fontSize={10}
              fontFamily="var(--font-mono)"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--ink)",
                color: "#fff",
                boxShadow: "var(--shadow-md)",
              }}
              formatter={(value: number) => formatCurrency(value, locale)}
              labelFormatter={(l) => `Day ${l}`}
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
    </div>
  );
}
