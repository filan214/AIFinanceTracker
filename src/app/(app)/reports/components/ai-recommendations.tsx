"use client";

import { Sparkles, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AIReportRecommendation } from "@/types/report";
import { ReportCard } from "./card";

export function AIRecommendations({
  recommendations,
}: {
  recommendations: AIReportRecommendation[];
}) {
  const t = useTranslations("reports");
  if (recommendations.length === 0) return null;

  return (
    <ReportCard
      icon={Sparkles}
      title={t("aiRecommendations")}
      action={
        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          AI
        </span>
      }
    >
      <p className="-mt-2 mb-3 text-[12px] text-zinc-400">{t("stepsNextMonth")}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/40"
          >
            <span className="font-mono text-[11px] font-semibold tracking-widest text-zinc-400">
              {r.id}
            </span>
            <h4 className="text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100">
              {r.title}
            </h4>
            <p className="flex-1 text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              {r.description}
            </p>
            {r.outcome && (
              <div className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                <span>{r.outcome}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </ReportCard>
  );
}
