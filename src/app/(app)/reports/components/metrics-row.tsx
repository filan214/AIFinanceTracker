"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "@/i18n/locale-provider";
import { formatCurrency } from "@/lib/format";
import type { ReportMetrics } from "@/types/report";

function ChangeRow({ change, upIsGood }: { change: number; upIsGood: boolean }) {
  const t = useTranslations("reports");
  const positive = change > 0;
  const good = change === 0 ? true : positive === upIsGood;
  return (
    <div className="mt-2 flex items-center gap-1.5 text-[11px]">
      <span
        className={
          "font-semibold " +
          (change === 0
            ? "text-zinc-400"
            : good
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-500 dark:text-rose-400")
        }
      >
        {change === 0 ? "" : positive ? "↑ " : "↓ "}
        {Math.abs(change)}%
      </span>
      <span className="text-zinc-400">{t("vsLastMonth")}</span>
    </div>
  );
}

function Metric({
  label,
  value,
  change,
  upIsGood,
  accent,
}: {
  label: string;
  value: string;
  change?: number | null;
  upIsGood?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-xl border p-4 shadow-[var(--shadow-sm)] " +
        (accent
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/15"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900")
      }
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={
          "mt-2 font-mono text-lg font-semibold tabular-nums sm:text-[22px] " +
          (accent ? "text-emerald-600 dark:text-emerald-400" : "")
        }
      >
        {value}
      </p>
      {typeof change === "number" && (
        <ChangeRow change={change} upIsGood={upIsGood ?? true} />
      )}
    </div>
  );
}

export function MetricsRow({ metrics }: { metrics: ReportMetrics }) {
  const t = useTranslations("reports");
  const { locale } = useLocale();

  const statusLabel: Record<ReportMetrics["savingsRateStatus"], string> = {
    above_average: t("rateAbove"),
    average: t("rateAverage"),
    below_average: t("rateBelow"),
  };
  const statusColor: Record<ReportMetrics["savingsRateStatus"], string> = {
    above_average: "text-emerald-600 dark:text-emerald-400",
    average: "text-amber-500 dark:text-amber-400",
    below_average: "text-rose-500 dark:text-rose-400",
  };

  return (
    <div className="animate-slide-up grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric
        label={t("totalSpent")}
        value={formatCurrency(metrics.totalSpent, locale)}
        change={metrics.spentChange}
        upIsGood={false}
      />
      <Metric
        label={t("totalIncome")}
        value={formatCurrency(metrics.totalIncome, locale)}
        change={metrics.incomeChange}
        upIsGood
      />
      <Metric
        label={t("saved")}
        value={formatCurrency(metrics.saved, locale)}
        accent
      />
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-[var(--shadow-sm)] dark:border-emerald-900/40 dark:bg-emerald-900/15">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {t("savingsRate")}
        </p>
        <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-[22px]">
          {metrics.savingsRate}%
        </p>
        <p
          className={
            "mt-2 text-[12px] font-medium " +
            statusColor[metrics.savingsRateStatus]
          }
        >
          {statusLabel[metrics.savingsRateStatus]}
          {metrics.savingsRateStatus === "above_average" && " 🔥"}
        </p>
      </div>
    </div>
  );
}
