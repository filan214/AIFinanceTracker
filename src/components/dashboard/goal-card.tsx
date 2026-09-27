"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressBar } from "@/components/planning/progress-bar";
import { useLocale } from "@/i18n/locale-provider";
import { formatCurrency } from "@/lib/format";
import { pickFeaturedGoal, type GoalView } from "@/lib/goal-progress";
import { fetchGoals } from "@/lib/planning/api";

export function GoalCard({ refreshKey }: { refreshKey: number }) {
  const t = useTranslations("dashboard");
  const tPlan = useTranslations("planning");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();
  const [goals, setGoals] = useState<GoalView[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGoals()
      .then((d) => {
        if (!cancelled) setGoals(d);
      })
      .catch(() => {
        if (!cancelled) setGoals([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const goal = goals ? pickFeaturedGoal(goals) : null;

  return (
    <div className="animate-slide-up rounded-xl border border-zinc-200 bg-white p-5 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold">{t("goalsTitle")}</h3>
        <Link
          href="/planning?tab=goals"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          {tCommon("viewAll")} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {goals === null ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-56" />
        </div>
      ) : !goal ? (
        <div className="py-4 text-center">
          <p className="text-sm text-zinc-500">{t("goalsEmpty")}</p>
          <Link
            href="/planning?tab=goals"
            className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {t("goalsCta")}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium">{goal.name}</span>
            <span className="font-mono text-xs text-zinc-500">{Math.round(goal.pct)}%</span>
          </div>
          <ProgressBar pct={goal.pct} tone={goal.status === "overdue" ? "over" : "ok"} />
          <p className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
            {tPlan("savedOf", {
              saved: formatCurrency(goal.saved, locale),
              target: formatCurrency(goal.target_amount, locale),
            })}
          </p>
          {goal.perMonth !== null && goal.monthsLeft !== null && (
            <p className="text-xs text-zinc-500">
              {tPlan("perMonthNeeded", {
                amount: formatCurrency(goal.perMonth, locale),
                months: goal.monthsLeft,
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
