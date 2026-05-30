"use client";

import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/i18n/locale-provider";
import { formatCompactCurrency } from "@/lib/format";
import { CATEGORY_COLOR, type CategoryKey } from "@/lib/mock-data";
import type { ReportMover } from "@/types/report";
import { ReportCard } from "./card";

export function BiggestMovers({ movers }: { movers: ReportMover[] }) {
  const t = useTranslations("reports");
  const tCat = useTranslations("categories");
  const { locale } = useLocale();

  const label = (key: string) =>
    key in CATEGORY_COLOR ? tCat(key as CategoryKey) : key;

  return (
    <ReportCard icon={TrendingUp} title={t("biggestMovers")}>
      <ul className="space-y-2.5">
        {movers.map((mv) => {
          const up = mv.direction === "up";
          // Spending going up is the unfavourable direction.
          const tone = up
            ? "text-rose-500 dark:text-rose-400"
            : "text-emerald-600 dark:text-emerald-400";
          return (
            <li key={mv.categoryKey} className="flex items-center gap-3">
              <span className={"text-base " + tone}>{up ? "↗" : "↘"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
                  {label(mv.categoryKey)}
                </p>
                <p className="font-mono text-[11px] tabular-nums text-zinc-400">
                  {formatCompactCurrency(mv.previousMonth, locale)} →{" "}
                  {formatCompactCurrency(mv.thisMonth, locale)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={"text-[13px] font-semibold tabular-nums " + tone}>
                  {up ? "+" : ""}
                  {mv.changePercent}%
                </p>
                <p className={"font-mono text-[11px] tabular-nums " + tone}>
                  {up ? "+" : "−"}
                  {formatCompactCurrency(mv.changeAbsolute, locale)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </ReportCard>
  );
}
