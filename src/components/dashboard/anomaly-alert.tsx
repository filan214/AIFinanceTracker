"use client";

import { Bell, X, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchAnomaly } from "@/lib/api";
import { useLocale } from "@/i18n/locale-provider";

const CACHE_KEY = "anomaly-cache";

function getCached(): { text: string; date: string } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.date === new Date().toISOString().slice(0, 10)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function setCache(text: string) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ text, date: new Date().toISOString().slice(0, 10) })
    );
  } catch {}
}

export function AnomalyAlert() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();

  useEffect(() => {
    let cancelled = false;

    const cached = getCached();
    if (cached) {
      setText(cached.text);
      setOpen(true);
      return;
    }

    fetchAnomaly(locale)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setText(result);
          setOpen(true);
          setCache(result);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (!open) return null;

  return (
    <div className="animate-slide-up group relative overflow-hidden rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/60 via-white to-white p-4 shadow-[var(--shadow-sm)] dark:border-amber-900/30 dark:from-amber-950/20 dark:via-zinc-900 dark:to-zinc-900">
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label={tCommon("dismiss")}
        className="absolute right-2.5 top-2.5 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex gap-3.5 pr-6">
        <div className="relative shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_2px_8px_-2px_rgba(245,158,11,0.5)]">
            <Bell className="h-4 w-4" />
          </div>
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t("anomalyTitle")}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <Sparkles className="h-2.5 w-2.5" />
              AI
            </span>
          </div>
          <p className="max-w-[720px] text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            {text}
          </p>
          <Link
            href="/chat"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber-700 transition-colors hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
          >
            {t("askAdvisor")}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
