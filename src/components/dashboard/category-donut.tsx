"use client";

import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useLocale } from "@/i18n/locale-provider";
import { CATEGORY_COLOR, type CategoryKey } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

type Datum = { category_key: CategoryKey; total: number };

export function CategoryDonut({ data }: { data: Datum[] }) {
  const { locale } = useLocale();
  const t = useTranslations("categories");
  const tDash = useTranslations("dashboard");

  const chartData = data.map((d) => ({
    name: t(d.category_key),
    value: d.total,
    fill: CATEGORY_COLOR[d.category_key],
    key: d.category_key,
  }));

  return (
    <div className="animate-slide-up rounded-xl border border-zinc-200 bg-white p-5 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-1">
        <h3 className="text-[13px] font-semibold">
          {tDash("byCategory")}
        </h3>
        <p className="text-[11px] text-zinc-400">
          {locale === "id" ? "Bulan ini" : "This month"}
        </p>
      </div>
      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="h-[160px] w-[160px] shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-md)",
                }}
                formatter={(value: number) => formatCurrency(value, locale)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 space-y-2 text-sm">
          {chartData.slice(0, 6).map((d) => (
            <li key={d.key} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 truncate">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded"
                  style={{ background: d.fill }}
                />
                <span className="truncate text-[13px] text-zinc-600 dark:text-zinc-300">
                  {d.name}
                </span>
              </span>
              <span className="font-mono text-xs font-medium tabular-nums">
                {formatCurrency(d.value, locale)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
