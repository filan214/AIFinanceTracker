"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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
import {
  TransactionModal,
  type TransactionDraft,
} from "@/components/transactions/transaction-modal";
import { useLocale } from "@/i18n/locale-provider";
import {
  fetchTransactions,
  createTransaction as apiCreateTransaction,
  categorizeTransaction,
  exportTransactionsCsv,
  type ApiTransaction,
} from "@/lib/api";
import { ANOMALY_CACHE_KEY } from "@/lib/anomaly-cache";
import type { CategoryKey } from "@/lib/mock-data";
import type { AnomalyResult } from "@/types/anomaly";

type Summary = {
  income: number;
  expense: number;
  balance: number;
  byCategory: { category_key: CategoryKey; total: number }[];
  dailyTotals: { day: string; total: number }[];
};

const EMPTY: Summary = {
  income: 0,
  expense: 0,
  balance: 0,
  byCategory: [],
  dailyTotals: [],
};

function summarize(
  txns: { amount: number; type: string; category_key: string; date: string }[]
): Summary {
  let income = 0;
  let expense = 0;
  const catMap = new Map<CategoryKey, number>();
  const dayMap = new Map<string, number>();
  for (const t of txns) {
    if (t.type === "income") {
      income += t.amount;
    } else {
      expense += t.amount;
      catMap.set(
        t.category_key as CategoryKey,
        (catMap.get(t.category_key as CategoryKey) ?? 0) + t.amount
      );
      dayMap.set(t.date, (dayMap.get(t.date) ?? 0) + t.amount);
    }
  }
  return {
    income,
    expense,
    balance: income - expense,
    byCategory: Array.from(catMap.entries())
      .map(([category_key, total]) => ({ category_key, total }))
      .sort((a, b) => b.total - a.total),
    dailyTotals: Array.from(dayMap.entries())
      .map(([day, total]) => ({ day, total }))
      .sort((a, b) => (a.day < b.day ? -1 : 1)),
  };
}

const MONTH_EN = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const MONTH_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [anomaly, setAnomaly] = useState<AnomalyResult | null>(null);
  const [anomalyDismissed, setAnomalyDismissed] = useState(false);
  const [anomalyRefresh, setAnomalyRefresh] = useState(0);

  const now = new Date();
  const [monthIdx, setMonthIdx] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const [current, setCurrent] = useState<Summary>(EMPTY);
  const [previous, setPrevious] = useState<Summary>(EMPTY);
  const [recent, setRecent] = useState<ApiTransaction[]>([]);

  const monthKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
  const prevYear = monthIdx === 0 ? year - 1 : year;
  const prevMonthIdx = monthIdx === 0 ? 11 : monthIdx - 1;
  const prevMonthKey = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, "0")}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [curRes, prevRes] = await Promise.all([
        fetchTransactions({ month: monthKey, limit: 500 }),
        fetchTransactions({ month: prevMonthKey, limit: 500 }),
      ]);
      setCurrent(summarize(curRes.data));
      setPrevious(summarize(prevRes.data));
      setRecent(curRes.data.slice(0, 8));
    } catch {
      setCurrent(EMPTY);
      setPrevious(EMPTY);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, [monthKey, prevMonthKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch the structured anomaly once per day (cached in sessionStorage).
  useEffect(() => {
    let cancelled = false;
    const today = new Date().toISOString().slice(0, 10);

    try {
      const cached = sessionStorage.getItem(ANOMALY_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { date: string; result: AnomalyResult };
        if (parsed.date === today) {
          setAnomaly(parsed.result);
          return;
        }
      }
    } catch {}

    (async () => {
      try {
        const res = await fetch("/api/ai/anomaly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: locale }),
        });
        const result = (await res.json()) as AnomalyResult;
        if (cancelled) return;
        setAnomaly(result);
        try {
          sessionStorage.setItem(
            ANOMALY_CACHE_KEY,
            JSON.stringify({ date: today, result })
          );
        } catch {}
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, anomalyRefresh]);

  const activeAnomaly = anomaly?.detected ? anomaly : null;

  function handleMonthChange(newIdx: number) {
    if (newIdx < 0) {
      setMonthIdx(11);
      setYear((y) => y - 1);
    } else if (newIdx > 11) {
      setMonthIdx(0);
      setYear((y) => y + 1);
    } else {
      setMonthIdx(newIdx);
    }
  }

  const expenseChange = previous.expense
    ? Math.round(
        ((current.expense - previous.expense) / previous.expense) * 100
      )
    : 0;
  const incomeChange = previous.income
    ? Math.round(
        ((current.income - previous.income) / previous.income) * 100
      )
    : 0;

  async function addTransaction(d: TransactionDraft) {
    try {
      const created = await apiCreateTransaction(d);
      categorizeTransaction(created.id, d.description, d.type).catch(() => {});
      fetchData();
      // Re-run anomaly detection so an in-place add reflects in the alert
      // without a manual refresh (cache was cleared by createTransaction).
      setAnomalyDismissed(false);
      setAnomalyRefresh((n) => n + 1);
    } catch {
      // silent
    }
    setModalOpen(false);
  }

  const monthLabel = (locale === "id" ? MONTH_ID : MONTH_EN)[monthIdx];

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
              onChange={handleMonthChange}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                const res = await fetchTransactions({ month: monthKey, limit: 500 });
                exportTransactionsCsv(res.data, `transactions-${monthKey}.csv`);
              }}
            >
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

      {activeAnomaly && !anomalyDismissed && (
        <AnomalyAlert
          anomaly={activeAnomaly}
          lang={locale}
          onDismiss={() => setAnomalyDismissed(true)}
          onReviewTransactions={() =>
            router.push(`/transactions?category=${activeAnomaly.category}`)
          }
          onAskAdvisor={(prefill) =>
            router.push(`/chat?q=${encodeURIComponent(prefill)}`)
          }
        />
      )}

      <div className="grid grid-cols-1 gap-3.5 sm:[grid-template-columns:1fr_1fr_1.4fr]">
        <MetricCard
          icon={ArrowUpRight}
          label={t("totalIncome")}
          amount={current.income}
          changePercent={incomeChange}
          tone="income"
        />
        <MetricCard
          icon={ArrowDownRight}
          label={t("totalExpense")}
          amount={current.expense}
          changePercent={expenseChange}
          tone="expense"
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

      <div className="grid grid-cols-1 gap-3.5 sm:[grid-template-columns:1.05fr_1.4fr]">
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
                ? `transaksi · ${monthLabel} ${year}`
                : `transactions · ${monthLabel} ${year}`}
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
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-zinc-400">
              {locale === "id"
                ? "Belum ada transaksi bulan ini."
                : "No transactions this month."}
            </div>
          ) : (
            recent.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))
          )}
        </div>
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addTransaction}
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
