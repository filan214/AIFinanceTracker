"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { BudgetsTab } from "@/components/planning/budgets-tab";
import { GoalsTab } from "@/components/planning/goals-tab";
import { cn } from "@/lib/cn";

const TABS = ["budgets", "goals"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = { budgets: "tabBudgets", goals: "tabGoals" };

export default function PlanningPage() {
  const t = useTranslations("planning");
  const [tab, setTab] = useState<Tab>("budgets");

  // Read ?tab= after mount (same approach as the transactions page) so the
  // page needs no Suspense boundary for useSearchParams.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    if (q && (TABS as readonly string[]).includes(q)) setTab(q as Tab);
  }, []);

  function select(next: Tab) {
    setTab(next);
    window.history.replaceState(null, "", `/planning?tab=${next}`);
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div
        role="tablist"
        className="inline-grid grid-flow-col gap-1 rounded-[9px] bg-zinc-100 p-1 dark:bg-zinc-800"
      >
        {TABS.map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => select(k)}
            className={cn(
              "rounded-[7px] px-3.5 py-1.5 text-[13px] font-medium transition-all",
              tab === k
                ? "bg-white text-zinc-900 shadow-[var(--shadow-sm)] dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            )}
          >
            {t(TAB_LABEL[k])}
          </button>
        ))}
      </div>
      {tab === "budgets" && <BudgetsTab />}
      {tab === "goals" && <GoalsTab />}
    </div>
  );
}
