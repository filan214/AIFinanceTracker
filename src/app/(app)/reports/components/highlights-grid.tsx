"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/i18n/locale-provider";
import { formatCompactCurrency, formatDate } from "@/lib/format";
import { CATEGORY_COLOR, type CategoryKey } from "@/lib/mock-data";
import type { ReportHighlights } from "@/types/report";
import { ReportCard } from "./card";

function Highlight({
  accent,
  label,
  value,
  sub,
}: {
  accent: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-lg bg-zinc-50 p-3.5 dark:bg-zinc-800/50"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
        {label}
      </span>
      <span className="truncate text-[18px] font-bold leading-tight text-zinc-900 dark:text-zinc-100">
        {value}
      </span>
      {sub && (
        <span className="truncate text-[11px] text-zinc-400" title={sub}>
          {sub}
        </span>
      )}
    </div>
  );
}

export function HighlightsGrid({
  highlights,
}: {
  highlights: ReportHighlights;
}) {
  const t = useTranslations("reports");
  const tCatShort = useTranslations("categoriesShort");
  const { locale } = useLocale();
  const { mostExpensiveDay, topCategory, transactionCount, newSubscriptions } =
    highlights;

  const shortCat = (key: string) =>
    key in CATEGORY_COLOR ? tCatShort(key as CategoryKey) : key;

  return (
    <ReportCard icon={Sparkles} title={t("highlights")}>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Highlight
          accent="#f43f5e"
          label={t("mostExpensiveDay")}
          value={mostExpensiveDay ? formatDate(mostExpensiveDay.date, locale) : "—"}
          sub={
            mostExpensiveDay
              ? `${mostExpensiveDay.description} · ${formatCompactCurrency(mostExpensiveDay.amount, locale)}`
              : ""
          }
        />
        <Highlight
          accent="#f59e0b"
          label={t("topCategory")}
          value={topCategory ? shortCat(topCategory.categoryKey) : "—"}
          sub={
            topCategory
              ? `${topCategory.percentage}% ${t("ofSpending")}`
              : ""
          }
        />
        <Highlight
          accent="#3b82f6"
          label={t("transactions")}
          value={`${transactionCount.total} ${t("transactionsUnit")}`}
          sub={`${formatCompactCurrency(transactionCount.averageAmount, locale)} ${t("average")}`}
        />
        <Highlight
          accent="#10b981"
          label={t("newSubscriptions")}
          value={
            newSubscriptions.count > 0
              ? `${newSubscriptions.count} ${t("detected")}`
              : t("noneDetected")
          }
          sub={newSubscriptions.names.join(", ")}
        />
      </div>
    </ReportCard>
  );
}
