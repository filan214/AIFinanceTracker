"use client";

import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/i18n/locale-provider";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/cn";

export function MetricCard({
  icon: Icon,
  label,
  amount,
  changePercent,
  emphasis = "default",
}: {
  icon: LucideIcon;
  label: string;
  amount: number;
  changePercent?: number;
  emphasis?: "default" | "primary";
}) {
  const { locale } = useLocale();
  const t = useTranslations("dashboard");
  const positive = (changePercent ?? 0) >= 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
        emphasis === "primary" && "ring-1 ring-emerald-500/50"
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold tracking-tight tabular-nums">
        {formatCurrency(amount, locale)}
      </div>
      {typeof changePercent === "number" ? (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 font-medium",
              positive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
            )}
          >
            {formatPercent(changePercent, locale)}
          </span>
          <span className="text-zinc-500">{t("vsLastMonth")}</span>
        </div>
      ) : null}
    </div>
  );
}
