"use client";

import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/i18n/locale-provider";
import { formatCurrency, formatNetCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/cn";

export function MetricCard({
  icon: Icon,
  label,
  amount,
  changePercent,
  emphasis = "default",
  tone = "neutral",
  income,
  expense,
}: {
  icon: LucideIcon;
  label: string;
  amount: number;
  changePercent?: number;
  emphasis?: "default" | "primary";
  tone?: "income" | "expense" | "neutral";
  income?: number;
  expense?: number;
}) {
  const { locale } = useLocale();
  const t = useTranslations("dashboard");
  const up = (changePercent ?? 0) >= 0;
  // Income rising is favourable; expense rising is not. Drives the trend colour.
  const favourable = tone === "expense" ? !up : up;

  // Each card carries its own accent so income (green) and expense (red) are
  // distinguishable at a glance, independent of the trend direction.
  const badgeClass =
    tone === "income"
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
      : tone === "expense"
        ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300";
  const trendClass = favourable
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-500 dark:text-rose-400";

  if (emphasis === "primary") {
    const inc = income ?? 0;
    const exp = expense ?? 0;
    // Share of income already spent; null when no income was recorded.
    const ratio = inc > 0 ? exp / inc : null;
    const state =
      ratio === null ? (exp > 0 ? "over" : "ok") : ratio < 0.8 ? "ok" : ratio <= 1 ? "warn" : "over";
    const badge = {
      ok: {
        label: locale === "id" ? "Sehat" : "Healthy",
        className: "bg-emerald-400/15 text-emerald-300",
      },
      warn: {
        label: locale === "id" ? "Perhatian" : "Warning",
        className: "bg-amber-400/15 text-amber-300",
      },
      over: {
        label: locale === "id" ? "Defisit" : "Deficit",
        className: "bg-rose-400/15 text-rose-300",
      },
    }[state];
    const barClass = { ok: "bg-emerald-500", warn: "bg-amber-400", over: "bg-rose-400" }[state];
    const barWidth = ratio === null ? (exp > 0 ? 100 : 0) : Math.min(ratio * 100, 100);
    return (
      <div className="animate-slide-up relative overflow-hidden rounded-xl bg-zinc-900 p-5 text-white dark:bg-zinc-800">
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/55">
              {label}
            </span>
            <span className={cn("rounded-[5px] px-2 py-0.5 text-[10px] font-medium", badge.className)}>
              {badge.label}
            </span>
          </div>
          <div
            className={cn(
              "font-mono text-[32px] font-semibold leading-tight tracking-tight",
              amount < 0 && "text-rose-300"
            )}
          >
            {formatNetCurrency(amount, locale)}
          </div>
          <div className="mt-1.5 text-xs text-white/60">
            {amount < 0 ? t("balanceNegative") : t("availableToSave")}
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-white/60">
            <span>{locale === "id" ? "Pengeluaran" : "Spent"}</span>
            <span className="font-mono normal-case tracking-normal">
              {ratio === null ? t("noIncome") : `${(ratio * 100).toFixed(0)}%`}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn("h-full rounded-full transition-all duration-1000 ease-out", barClass)}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>
        <svg
          className="pointer-events-none absolute -right-5 -top-5 opacity-[0.06]"
          width="200"
          height="120"
          viewBox="0 0 200 120"
        >
          <path
            d="M0 100 L30 80 L55 90 L85 50 L115 60 L145 30 L175 40 L200 20"
            stroke="var(--accent)"
            strokeWidth="3"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="animate-slide-up rounded-xl border border-zinc-200 bg-white p-5 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[7px]",
            badgeClass
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
        </div>
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold tracking-tight tabular-nums">
        {formatCurrency(amount, locale)}
      </div>
      {typeof changePercent === "number" ? (
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          <span className={cn("font-semibold", trendClass)}>
            {up ? "↑" : "↓"} {Math.abs(changePercent).toFixed(1)}%
          </span>
          <span className="text-zinc-400">{t("vsLastMonth")}</span>
        </div>
      ) : null}
    </div>
  );
}
