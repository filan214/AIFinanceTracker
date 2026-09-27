"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MonthPicker } from "@/components/ui/month-picker";
import { CategoryBadge } from "@/components/category-badge";
import { useLocale } from "@/i18n/locale-provider";
import { daysLeftInMonth, type BudgetWithSpent } from "@/lib/budget-progress";
import { EXPENSE_CATEGORY_KEYS, type ExpenseCategoryKey } from "@/lib/draft";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import { localToday } from "@/lib/ymd";
import { deleteBudget, fetchBudgets, saveBudget } from "@/lib/planning/api";
import { BudgetForm } from "./budget-form";
import { ConfirmDelete } from "./confirm-delete";
import { ListSkeleton } from "./list-skeleton";
import { ProgressBar } from "./progress-bar";

export function BudgetsTab() {
  const t = useTranslations("planning");
  const now = new Date();
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const month = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
  const [items, setItems] = useState<BudgetWithSpent[] | null>(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<string | null>(null); // "new" or a budget id

  const load = useCallback(async () => {
    setError(false);
    try {
      setItems(await fetchBudgets(month));
    } catch {
      setError(true);
      setItems([]);
    }
  }, [month]);

  useEffect(() => {
    setItems(null);
    load();
  }, [load]);

  function changeMonth(idx: number) {
    if (idx < 0) {
      setMonthIdx(11);
      setYear((y) => y - 1);
    } else if (idx > 11) {
      setMonthIdx(0);
      setYear((y) => y + 1);
    } else {
      setMonthIdx(idx);
    }
  }

  async function save(category: ExpenseCategoryKey, amount: number) {
    await saveBudget(category, amount);
    setEditing(null);
    await load();
  }

  async function remove(id: string) {
    await deleteBudget(id).catch(() => {});
    await load();
  }

  const daysLeft = daysLeftInMonth(month, localToday());
  const used = new Set((items ?? []).map((b) => b.category_key));
  const available = EXPENSE_CATEGORY_KEYS.filter((k) => !used.has(k));

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <MonthPicker monthIdx={monthIdx} year={year} onChange={changeMonth} />
        {items !== null && available.length > 0 && editing === null && (
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-3.5 w-3.5" />
            {t("addBudget")}
          </Button>
        )}
      </div>

      {editing === "new" && (
        <BudgetForm categories={available} onSubmit={save} onCancel={() => setEditing(null)} />
      )}

      {items === null ? (
        <ListSkeleton />
      ) : error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{t("loadError")}</p>
      ) : items.length === 0 ? (
        editing === null && (
          <EmptyState
            icon={Target}
            title={t("budgetsEmptyTitle")}
            subtitle={t("budgetsEmptySub")}
            action={
              <Button size="sm" onClick={() => setEditing("new")}>
                <Plus className="h-3.5 w-3.5" />
                {t("addBudget")}
              </Button>
            }
          />
        )
      ) : (
        <div className="animate-slide-up divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[var(--shadow-sm)] dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {items.map((b) =>
            editing === b.id ? (
              <div key={b.id} className="p-3">
                <BudgetForm
                  categories={[b.category_key as ExpenseCategoryKey]}
                  initial={{ category_key: b.category_key as ExpenseCategoryKey, amount: b.amount }}
                  onSubmit={save}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <BudgetRowView
                key={b.id}
                budget={b}
                daysLeft={daysLeft}
                onEdit={() => setEditing(b.id)}
                onDelete={() => remove(b.id)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function BudgetRowView({
  budget: b,
  daysLeft,
  onEdit,
  onDelete,
}: {
  budget: BudgetWithSpent;
  daysLeft: number | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("planning");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();
  return (
    <div className="space-y-2 px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <CategoryBadge categoryKey={b.category_key} />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={tCommon("edit")}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <ConfirmDelete onConfirm={onDelete} />
        </div>
      </div>
      <ProgressBar pct={b.pct} tone={b.status} />
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
        <span className="font-mono text-zinc-600 dark:text-zinc-300">
          {t("spentOf", {
            spent: formatCurrency(b.spent, locale),
            limit: formatCurrency(b.amount, locale),
          })}
        </span>
        <span
          className={cn(
            "font-medium",
            b.status === "over"
              ? "text-rose-600 dark:text-rose-400"
              : b.status === "warn"
                ? "text-amber-600 dark:text-amber-400"
                : "text-zinc-500"
          )}
        >
          {b.remaining >= 0
            ? t("remaining", { amount: formatCurrency(b.remaining, locale) })
            : t("overBy", { amount: formatCurrency(-b.remaining, locale) })}
          {daysLeft !== null && ` · ${t("daysLeft", { count: daysLeft })}`}
        </span>
      </div>
    </div>
  );
}
