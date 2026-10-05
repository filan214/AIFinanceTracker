"use client";

import { ArrowRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { formatCurrency } from "@/lib/format";
import type { MonthSummary } from "@/lib/month-summary";
import { cn } from "@/lib/cn";

// A plain-language read of the month, built from the dashboard's own numbers
// (no AI request), with a shortcut to ask the advisor about the top category.
export function InsightCard({
  summary,
  monthLabel,
}: {
  summary: MonthSummary;
  monthLabel: string;
}) {
  const t = useTranslations("dashboard");
  const tCat = useTranslations("categories");
  const { locale } = useLocale();

  const amount = formatCurrency(summary.spent, locale);
  const category = summary.top ? tCat(summary.top.key) : null;

  const sentences: string[] = [];
  if (summary.spent === 0) {
    sentences.push(t("insightEmpty", { month: monthLabel }));
  } else {
    const lead =
      summary.direction === "less"
        ? t("insightSpentLess", { amount, month: monthLabel, pct: summary.changePct ?? 0 })
        : summary.direction === "more"
          ? t("insightSpentMore", { amount, month: monthLabel, pct: summary.changePct ?? 0 })
          : summary.direction === "same"
            ? t("insightSpentSame", { amount, month: monthLabel })
            : t("insightSpent", { amount, month: monthLabel });
    sentences.push(lead);
    if (summary.top && category) {
      sentences.push(t("insightTop", { category, share: summary.top.share }));
    }
    if (summary.overspent) sentences.push(t("insightOverspent"));
  }

  const ask = category ? t("insightAsk", { category }) : t("insightAskGeneric", { month: monthLabel });
  const prompt = category
    ? t("insightAskPrompt", { category })
    : t("insightAskGenericPrompt", { month: monthLabel });

  const Icon =
    summary.direction === "more" ? TrendingUp : summary.direction === "less" ? TrendingDown : Wallet;
  const iconTone =
    summary.direction === "more"
      ? "text-rose-400"
      : summary.direction === "less"
        ? "text-emerald-400"
        : "text-zinc-300";

  return (
    <div className="animate-slide-up rounded-xl border border-zinc-200 bg-white p-5 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 dark:bg-zinc-700">
          <Icon className={cn("h-3.5 w-3.5", iconTone)} aria-hidden />
        </div>
        <span className="text-xs font-semibold">{t("insightLabel")}</span>
      </div>
      <p className="mb-3.5 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300" style={{ textWrap: "pretty" }}>
        {sentences.join(" ")}
      </p>
      <div className="flex items-center justify-between gap-2.5 rounded-[9px] border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800">
        <span className="text-xs text-zinc-600 dark:text-zinc-300">{ask}</span>
        <Link
          href={`/chat?q=${encodeURIComponent(prompt)}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-zinc-800 dark:bg-zinc-600 dark:hover:bg-zinc-500 [@media(hover:none)]:min-h-11"
        >
          {t("askAdvisor")} <ArrowRight className="h-2.5 w-2.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
