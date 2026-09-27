"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/locale-provider";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { GoalView } from "@/lib/goal-progress";
import {
  addContribution,
  deleteContribution,
  deleteGoal,
  updateGoal,
} from "@/lib/planning/api";
import { ConfirmDelete } from "./confirm-delete";
import { ContributionForm } from "./contribution-form";
import { GoalForm } from "./goal-form";
import { ProgressBar } from "./progress-bar";

export function GoalItem({ goal, onChanged }: { goal: GoalView; onChanged: () => Promise<void> }) {
  const t = useTranslations("planning");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();
  const [mode, setMode] = useState<"view" | "edit" | "topup">("view");
  const [showHistory, setShowHistory] = useState(false);

  if (mode === "edit") {
    return (
      <GoalForm
        initial={{ name: goal.name, target_amount: goal.target_amount, target_date: goal.target_date }}
        onSubmit={async (input) => {
          await updateGoal(goal.id, input);
          setMode("view");
          await onChanged();
        }}
        onCancel={() => setMode("view")}
      />
    );
  }

  return (
    <div className="animate-slide-up space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{goal.name}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            {goal.target_date
              ? t("targetBy", { date: formatDate(goal.target_date, locale) })
              : t("noTargetDate")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {goal.status !== "active" && (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                goal.status === "done"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
              )}
            >
              {goal.status === "done" ? t("statusDone") : t("statusOverdue")}
            </span>
          )}
          <button
            type="button"
            onClick={() => setMode("edit")}
            aria-label={tCommon("edit")}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmDelete
            onConfirm={async () => {
              await deleteGoal(goal.id).catch(() => {});
              await onChanged();
            }}
          />
        </div>
      </div>

      <ProgressBar pct={goal.pct} tone={goal.status === "overdue" ? "over" : "ok"} />
      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs">
        <span className="font-mono text-zinc-600 dark:text-zinc-300">
          {t("savedOf", {
            saved: formatCurrency(goal.saved, locale),
            target: formatCurrency(goal.target_amount, locale),
          })}
        </span>
        <span className="font-mono text-zinc-500">{Math.round(goal.pct)}%</span>
      </div>
      {goal.perMonth !== null && goal.monthsLeft !== null && (
        <p className="text-xs text-zinc-500">
          {t("perMonthNeeded", {
            amount: formatCurrency(goal.perMonth, locale),
            months: goal.monthsLeft,
          })}
        </p>
      )}

      {mode === "topup" ? (
        <ContributionForm
          onSubmit={async (input) => {
            await addContribution(goal.id, input);
            setMode("view");
            await onChanged();
          }}
          onCancel={() => setMode("view")}
        />
      ) : (
        <div className="flex items-center justify-between">
          <Button size="sm" variant="secondary" onClick={() => setMode("topup")}>
            <Plus className="h-3.5 w-3.5" />
            {t("addTopUp")}
          </Button>
          <button
            type="button"
            onClick={() => setShowHistory((s) => !s)}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            {t("history")} ({goal.contributions.length})
            <ChevronDown className={cn("h-3 w-3 transition-transform", showHistory && "rotate-180")} />
          </button>
        </div>
      )}

      {showHistory &&
        (goal.contributions.length === 0 ? (
          <p className="text-xs text-zinc-400">{t("noTopUps")}</p>
        ) : (
          <ul className="divide-y divide-zinc-100 text-xs dark:divide-zinc-800">
            {goal.contributions.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-1.5">
                <span className="text-zinc-500">{formatDate(c.date, locale)}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(c.amount, locale)}
                  </span>
                  <ConfirmDelete
                    onConfirm={async () => {
                      await deleteContribution(c.id).catch(() => {});
                      await onChanged();
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
