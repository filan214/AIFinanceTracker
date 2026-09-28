"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { BudgetsTab } from "@/components/planning/budgets-tab";
import { GoalsTab } from "@/components/planning/goals-tab";
import { RecurringTab } from "@/components/planning/recurring-tab";
import { cn } from "@/lib/cn";

const TABS = ["budgets", "goals", "recurring"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
  budgets: "tabBudgets",
  goals: "tabGoals",
  recurring: "tabRecurring",
};

function toTab(value: string | null): Tab {
  return value && (TABS as readonly string[]).includes(value) ? (value as Tab) : "budgets";
}

export default function PlanningPage() {
  return (
    <Suspense>
      <PlanningPageContent />
    </Suspense>
  );
}

function PlanningPageContent() {
  const t = useTranslations("planning");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(() => toTab(tabParam));

  // The tab always follows ?tab= — including a same-route navigation that
  // only changes the query (e.g. a sidebar link to bare /planning while a
  // different tab is showing), which a mount-only effect would have missed.
  useEffect(() => {
    const next = toTab(tabParam);
    setTab((current) => (current === next ? current : next));
  }, [tabParam]);

  function select(next: Tab) {
    router.replace(`/planning?tab=${next}`, { scroll: false });
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
      {tab === "recurring" && <RecurringTab />}
    </div>
  );
}
