"use client";

import { Bell, X, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchAnomaly } from "@/lib/api";
import { useLocale } from "@/i18n/locale-provider";

export function AnomalyAlert() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();

  useEffect(() => {
    fetchAnomaly(locale)
      .then((result) => {
        if (result) {
          setText(result);
          setOpen(true);
        }
      })
      .catch(() => {
        setText(t("anomalyBody"));
        setOpen(true);
      });
  }, [locale, t]);

  if (!open) return null;

  return (
    <div className="animate-slide-up flex gap-3.5 rounded-xl border border-amber-200 bg-white p-3.5 shadow-[var(--shadow-sm)] dark:border-amber-900/40 dark:bg-zinc-900">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 dark:bg-amber-900/30 dark:text-amber-400">
        <Bell className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[13px] font-semibold">{t("anomalyTitle")}</span>
          <span className="rounded bg-amber-50 px-1.5 py-px text-[9px] font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            AI
          </span>
        </div>
        <p className="max-w-[720px] text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {text}
        </p>
        <div className="mt-2 flex gap-3.5">
          <button className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100">
            {t("learnMore")} <ArrowRight className="h-3 w-3" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {tCommon("dismiss")}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label={tCommon("dismiss")}
        className="self-start text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
