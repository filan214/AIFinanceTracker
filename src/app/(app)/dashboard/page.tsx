"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AnomalyAlert } from "@/components/dashboard/anomaly-alert";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { DailyLine } from "@/components/dashboard/daily-line";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import {
  currentMonthKey,
  getTransactionsForMonth,
  previousMonthKey,
  summarizeMonth,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(id);
  }, []);

  const current = summarizeMonth(currentMonthKey());
  const previous = summarizeMonth(previousMonthKey());
  const expenseChange = previous.expense
    ? Math.round(((current.expense - previous.expense) / previous.expense) * 100)
    : 0;
  const incomeChange = previous.income
    ? Math.round(((current.income - previous.income) / previous.income) * 100)
    : 0;
  const balanceChange = previous.balance
    ? Math.round(((current.balance - previous.balance) / Math.abs(previous.balance)) * 100)
    : 0;

  const recent = getTransactionsForMonth(currentMonthKey()).slice(0, 5);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            {tCommon("add")}
          </Button>
        }
      />

      <AnomalyAlert />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={ArrowDownCircle}
          label={t("totalIncome")}
          amount={current.income}
          changePercent={incomeChange}
        />
        <MetricCard
          icon={ArrowUpCircle}
          label={t("totalExpense")}
          amount={current.expense}
          changePercent={expenseChange}
        />
        <MetricCard
          icon={Wallet}
          label={t("balance")}
          amount={current.balance}
          changePercent={balanceChange}
          emphasis="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryDonut data={current.byCategory} />
        <DailyLine data={current.dailyTotals} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("recentTransactions")}
          </h3>
          <Link
            href="/transactions"
            className="text-xs font-medium text-emerald-600 hover:underline"
          >
            {tCommon("viewAll")}
          </Link>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {recent.map((t) => (
            <TransactionRow key={t.id} transaction={t} />
          ))}
        </div>
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => setModalOpen(false)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
