"use client";

import { Bell, ListFilter, Sparkles, X } from "lucide-react";
import type { AnomalyResult } from "@/types/anomaly";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";

type DetectedAnomaly = Extract<AnomalyResult, { detected: true }>;

const COPY = {
  title: { id: "Pengeluaran tidak biasa terdeteksi", en: "Unusual spending detected" },
  needs_attention: { id: "PERLU PERHATIAN", en: "NEEDS ATTENTION" },
  this_week: { id: "Minggu ini", en: "This week" },
  typical: { id: "Rata-rata", en: "Typical" },
  triggered: { id: "{n} TRANSAKSI MEMICU ALERT INI", en: "{n} TRANSACTIONS TRIGGERED THIS ALERT" },
  review: { id: "Lihat transaksi", en: "Review transactions" },
  ask_advisor: { id: "Tanya Advisor", en: "Ask Advisor" },
  dismiss: { id: "Abaikan", en: "Dismiss" },
  new_badge: { id: "Baru", en: "New" },
};

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
    <div className="animate-slide-up relative flex flex-col gap-3.5 overflow-hidden rounded-xl border border-zinc-200 border-l-4 border-l-amber-500 bg-white p-5 shadow-[var(--shadow-md)] dark:border-zinc-800 dark:border-l-amber-500 dark:bg-zinc-900">
      <button
        type="button"
        onClick={onDismiss}
        aria-label={c("dismiss")}
        className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 pr-7">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
        </span>
        <Bell className="h-4 w-4 shrink-0 text-amber-500" />
        <h3 className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {c("title")}
        </h3>
        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-900/30 dark:text-amber-300">
          {c("needs_attention")}
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
          <Sparkles className="h-2.5 w-2.5" />
          AI
        </span>
      </div>

      {/* Summary */}
      <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {anomaly.summary}
      </p>

      {/* Comparison bars */}
      <div className="flex items-center gap-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
        <div className="flex flex-1 flex-col gap-2.5">
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
        <div className="flex min-w-[72px] flex-col items-center gap-0.5 text-center">
          <span className="font-mono text-2xl font-bold leading-none text-rose-500">
            {pctLabel}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
            {anomaly.categoryLabel}
          </span>
        </div>
      </div>

      {/* Triggered transactions */}
      {triggered.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            {c("triggered").replace("{n}", String(triggered.length))}
          </p>
          {triggered.map((tx, i) => (
            <div
              key={tx.id || i}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[13px] dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">
                {tx.description}
              </span>
              {tx.isNew && (
                <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                  {c("new_badge")}
                </span>
              )}
              <span className="shrink-0 font-mono text-[13px] font-medium text-rose-500">
                {formatSignedCurrency(-Math.abs(tx.amount), lang)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReviewTransactions}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-85 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <ListFilter className="h-3.5 w-3.5" />
          {c("review")}
        </button>
        <button
          type="button"
          onClick={() => onAskAdvisor(askPrefill)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-[13px] font-medium text-zinc-700 transition-colors hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-zinc-500"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {c("ask_advisor")}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-3 py-2 text-[13px] text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
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
      <span className="min-w-[72px] text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="min-w-[88px] text-right font-mono text-xs text-zinc-900 dark:text-zinc-100">
        {amount}
      </span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <span
          className={`block h-full rounded-full transition-[width] duration-700 ${color === "red" ? "bg-rose-500" : "bg-zinc-400"}`}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}
