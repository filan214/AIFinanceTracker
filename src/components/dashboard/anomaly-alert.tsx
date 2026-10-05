"use client";

import { useState } from "react";
import { ChevronDown, ListFilter, Sparkles, X } from "lucide-react";
import type { AnomalyResult } from "@/types/anomaly";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";

type DetectedAnomaly = Extract<AnomalyResult, { detected: true }>;

const COPY = {
  title: { id: "Pengeluaran tidak biasa terdeteksi", en: "Unusual spending detected" },
  this_week: { id: "Minggu ini", en: "This week" },
  typical: { id: "Rata-rata", en: "Typical" },
  triggered: { id: "{n} transaksi memicu peringatan ini", en: "{n} transactions triggered this alert" },
  review: { id: "Lihat transaksi", en: "Review transactions" },
  ask_advisor: { id: "Tanya Advisor", en: "Ask Advisor" },
  dismiss: { id: "Abaikan", en: "Dismiss" },
  new_badge: { id: "Baru", en: "New" },
};

// The amber edge is the alert's one state signal; the triggered transactions
// sit behind a disclosure so the alert doesn't push the month's numbers off
// the first screen.
export function AnomalyAlert({
  anomaly,
  onDismiss,
  onReviewTransactions,
  onAskAdvisor,
  lang,
}: {
  anomaly: DetectedAnomaly;
  onDismiss: () => void;
  onReviewTransactions: () => void;
  onAskAdvisor: (prefill: string) => void;
  lang: "id" | "en";
}) {
  const c = (k: keyof typeof COPY) => COPY[k][lang];
  const [showTriggered, setShowTriggered] = useState(false);

  const max = Math.max(anomaly.thisWeek, anomaly.typical, 1);
  const thisWeekPct = Math.round((anomaly.thisWeek / max) * 100);
  const typicalPct = Math.round((anomaly.typical / max) * 100);
  const pctLabel = `${anomaly.direction === "down" ? "−" : "+"}${anomaly.percentageChange}%`;

  const askPrefill =
    lang === "en"
      ? `Why did my ${anomaly.categoryLabel} spending spike this week?`
      : `Kenapa pengeluaran ${anomaly.categoryLabel} saya naik minggu ini?`;

  const triggered = anomaly.triggeredTransactions ?? [];

  return (
    <div className="animate-slide-up relative flex flex-col gap-3 overflow-hidden rounded-xl border border-zinc-200 border-l-4 border-l-amber-500 bg-white p-4 shadow-[var(--shadow-md)] dark:border-zinc-800 dark:border-l-amber-500 dark:bg-zinc-900">
      <button
        type="button"
        onClick={onDismiss}
        aria-label={c("dismiss")}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 [@media(hover:none)]:h-11 [@media(hover:none)]:w-11"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 pr-10">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{c("title")}</h3>
        <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <Sparkles className="h-2.5 w-2.5" aria-hidden />
          AI
        </span>
      </div>

      <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">{anomaly.summary}</p>

      <div className="flex items-center gap-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <BarRow
            color="red"
            label={c("this_week")}
            amount={formatCurrency(anomaly.thisWeek, lang)}
            pct={thisWeekPct}
          />
          <BarRow
            color="gray"
            label={c("typical")}
            amount={formatCurrency(anomaly.typical, lang)}
            pct={typicalPct}
          />
        </div>
        <div className="flex min-w-[64px] flex-col items-center gap-0.5 text-center">
          <span className="font-mono text-xl font-bold leading-none text-rose-600 dark:text-rose-400">
            {pctLabel}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {anomaly.categoryLabel}
          </span>
        </div>
      </div>

      {triggered.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowTriggered((v) => !v)}
            aria-expanded={showTriggered}
            className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 [@media(hover:none)]:min-h-11"
          >
            {c("triggered").replace("{n}", String(triggered.length))}
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", showTriggered && "rotate-180")}
              aria-hidden
            />
          </button>
          {showTriggered && (
            <div className="mt-2 flex flex-col gap-1.5">
              {triggered.map((tx, i) => (
                <div
                  key={tx.id || i}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[13px] dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-300">
                    {tx.description}
                  </span>
                  {tx.isNew && (
                    <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {c("new_badge")}
                    </span>
                  )}
                  <span className="shrink-0 font-mono text-[13px] font-medium text-rose-600 dark:text-rose-400">
                    {formatSignedCurrency(-Math.abs(tx.amount), lang)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onReviewTransactions}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85 dark:bg-zinc-100 dark:text-zinc-900 [@media(hover:none)]:min-h-11"
        >
          <ListFilter className="h-3.5 w-3.5" aria-hidden />
          {c("review")}
        </button>
        <button
          type="button"
          onClick={() => onAskAdvisor(askPrefill)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3.5 py-2 text-[13px] font-medium text-zinc-700 transition-colors hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-zinc-500 [@media(hover:none)]:min-h-11"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {c("ask_advisor")}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-3 py-2 text-[13px] text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 [@media(hover:none)]:min-h-11"
        >
          {c("dismiss")}
        </button>
      </div>
    </div>
  );
}

function BarRow({
  color,
  label,
  amount,
  pct,
}: {
  color: "red" | "gray";
  label: string;
  amount: string;
  pct: number;
}) {
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${color === "red" ? "bg-rose-500" : "bg-zinc-400"}`}
      />
      <span className="min-w-[64px] text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="min-w-[88px] text-right font-mono text-xs text-zinc-900 dark:text-zinc-100">
        {amount}
      </span>
      <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <span
          className={`block h-full rounded-full transition-[width] duration-700 ${color === "red" ? "bg-rose-500" : "bg-zinc-400"}`}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}
