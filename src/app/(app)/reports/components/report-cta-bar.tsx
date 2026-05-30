"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

// Bottom dark bar nudging the user into the Chat advisor.
export function ReportCTABar({ monthLabel }: { monthLabel: string }) {
  const t = useTranslations("reports");
  const router = useRouter();

  return (
    <div className="animate-slide-up flex flex-col items-start gap-3 rounded-xl bg-zinc-900 px-6 py-4 text-white sm:flex-row sm:items-center sm:justify-between dark:bg-zinc-800 print:hidden">
      <span className="text-sm text-white/80">{t("ctaQuestion")}</span>
      <button
        onClick={() =>
          router.push(
            `/chat?q=${encodeURIComponent(`Tell me more about my ${monthLabel} report`)}`
          )
        }
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-[13px] font-medium transition-colors hover:bg-white/20"
      >
        {t("askAdvisor")}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
