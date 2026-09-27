"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBadge } from "@/components/category-badge";
import { ProgressBar } from "@/components/planning/progress-bar";
import { fetchBudgets } from "@/lib/planning/api";
import type { BudgetWithSpent } from "@/lib/budget-progress";

// Top 3 budgets closest to (or over) their limit for the dashboard's month.
export function BudgetCard({ month, refreshKey }: { month: string; refreshKey: number }) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [items, setItems] = useState<BudgetWithSpent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBudgets(month)
      .then((d) => {
        if (!cancelled) setItems(d);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [month, refreshKey]);

  return (
    <div className="animate-slide-up rounded-xl border border-zinc-200 bg-white p-5 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold">{t("budgetsTitle")}</h3>
        <Link
          href="/planning?tab=budgets"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          {tCommon("viewAll")} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {items === null ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-sm text-zinc-500">{t("budgetsEmpty")}</p>
          <Link
            href="/planning?tab=budgets"
            className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {t("budgetsCta")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.slice(0, 3).map((b) => (
            <div key={b.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <CategoryBadge categoryKey={b.category_key} />
                <span className="font-mono text-zinc-500">{Math.round(b.pct)}%</span>
              </div>
              <ProgressBar pct={b.pct} tone={b.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
