"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function InsightCard() {
  const t = useTranslations("dashboard");

  return (
    <div className="animate-slide-up rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-emerald-400 dark:bg-zinc-700">
          <Sparkles className="h-3 w-3" />
        </div>
        <span className="text-xs font-semibold">{t("insightLabel")}</span>
        <span className="rounded bg-emerald-500 px-1.5 py-px text-[9px] font-semibold text-white">
          AI
        </span>
      </div>
      <p className="mb-3.5 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300" style={{ textWrap: "pretty" }}>
        {t("insightText")}
      </p>
      <div className="flex items-center justify-between gap-2.5 rounded-[9px] border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800">
        <span className="text-xs text-zinc-500">
          {t("insightActionable")}
        </span>
        <Link
          href="/chat"
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-zinc-800 dark:bg-zinc-600 dark:hover:bg-zinc-500"
        >
          {t("askAdvisor")} <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </div>
    </div>
  );
}
