"use client";

import type { ReactNode } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { AIReportContent } from "@/types/report";

// Render **bold** spans without a markdown dependency.
function renderBold(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((seg, i) =>
    seg.startsWith("**") && seg.endsWith("**") ? (
      <strong key={i} className="font-semibold text-zinc-900 dark:text-zinc-100">
        {seg.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{seg}</span>
    )
  );
}

export function SummaryCard({
  content,
  generating,
  onGenerate,
}: {
  content: AIReportContent | null;
  generating: boolean;
  onGenerate: () => void;
}) {
  const t = useTranslations("reports");
  const paragraphs = content
    ? [
        content.summary.paragraph1,
        content.summary.paragraph2,
        content.summary.paragraph3,
      ].filter((p) => p.trim())
    : [];

  return (
    <div className="animate-slide-up rounded-xl border border-zinc-200 bg-white p-6 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-[14px] font-semibold">{t("summaryTitle")}</h3>
          <span className="text-[11px] text-zinc-400">{t("aiGenerated")}</span>
        </div>
      </div>

      {paragraphs.length > 0 ? (
        <div className="space-y-2.5 text-[14px] leading-[1.7] text-zinc-600 dark:text-zinc-300">
          {paragraphs.map((p, i) => (
            <p key={i}>{renderBold(p)}</p>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center dark:border-zinc-700 dark:bg-zinc-800/50 print:hidden">
          {generating ? (
            <div className="flex flex-col items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <span>{t("generating")}</span>
              <span className="text-xs text-zinc-400">{t("generatingSub")}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-zinc-500">{t("aiInsightsSub")}</p>
              <Button size="sm" onClick={onGenerate}>
                <Sparkles className="h-3.5 w-3.5" />
                {t("generate")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
