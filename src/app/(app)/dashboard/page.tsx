"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Download,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthPicker } from "@/components/ui/month-picker";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AnomalyAlert } from "@/components/dashboard/anomaly-alert";
import { InsightCard } from "@/components/dashboard/insight-card";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { DailyLine } from "@/components/dashboard/daily-line";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { TransactionModal } from "@/components/transactions/transaction-modal";
import { CategoryBadge } from "@/components/category-badge";
import { useLocale } from "@/i18n/locale-provider";
import { formatCurrency } from "@/lib/format";
import {
  currentMonthKey,
  getTransactionsForMonth,
  previousMonthKey,
  summarizeMonth,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [monthIdx, setMonthIdx] = useState(4);
  const [year] = useState(2026);

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

  const recent = getTransactionsForMonth(currentMonthKey()).slice(0, 8);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-3.5">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        liveBadge
        actions={
          <>
            <MonthPicker
              monthIdx={monthIdx}
              year={year}
              onChange={(n) => setMonthIdx(((n % 12) + 12) % 12)}
            />
            <Button variant="secondary" size="sm">
              <Download className="h-3.5 w-3.5" />
              {locale === "id" ? "Ekspor" : "Export"}
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              {tCommon("add")}
            </Button>
          </>
        }
      />

      <AnomalyAlert />

      <div className="grid gap-3.5 sm:grid-cols-3" style={{ gridTemplateColumns: "1fr 1fr 1.4fr" }}>
        <MetricCard
          icon={ArrowUpRight}
          label={t("totalIncome")}
          amount={current.income}
          changePercent={incomeChange}
        />
        <MetricCard
          icon={ArrowDownRight}
          label={t("totalExpense")}
          amount={current.expense}
          changePercent={expenseChange}
        />
        <MetricCard
          icon={Wallet}
          label={t("balance")}
          amount={current.balance}
          changePercent={0}
          emphasis="primary"
          income={current.income}
          expense={current.expense}
        />
      </div>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "1.05fr 1.4fr" }}>
        <CategoryDonut data={current.byCategory} />
        <DailyLine data={current.dailyTotals} />
      </div>

      <InsightCard />

      <div className="animate-slide-up overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
          <div>
            <h3 className="text-[13px] font-semibold">
              {t("recentTransactions")}
            </h3>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {recent.length}{" "}
              {locale === "id"
                ? "transaksi · Mei 2026"
                : "transactions · May 2026"}
            </p>
          </div>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            {tCommon("viewAll")} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="max-h-[520px] overflow-auto">
          {recent.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx} />
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
    <div className="space-y-3.5" aria-busy="true">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-3.5 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid gap-3.5 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-32" />
      <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
