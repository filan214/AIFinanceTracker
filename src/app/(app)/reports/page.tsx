"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Sparkles, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/i18n/locale-provider";
import { formatCurrency } from "@/lib/format";

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function ReportsPage() {
  const t = useTranslations("reports");
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(3);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(id);
  }, []);

  if (loading) return <ReportsSkeleton />;

  const months = locale === "id" ? MONTHS_ID : MONTHS_EN;

  const reports = [
    {
      month: t("sampleMonth"),
      body: t("sampleBody"),
      total: 2340000,
      change: 18,
      generated: true,
    },
    {
      month: t("olderMonth"),
      body: t("olderBody"),
      total: 1980000,
      change: -6,
      generated: true,
    },
    {
      month: t("oldestMonth"),
      body: t("oldestBody"),
      total: 2108000,
      change: 3,
      generated: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {months.map((m, i) => {
          const active = i === selectedMonth;
          return (
            <button
              key={m}
              onClick={() => setSelectedMonth(i)}
              className={
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors " +
                (active
                  ? "bg-zinc-900 text-white shadow-[var(--shadow-sm)] dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700")
              }
            >
              {m}
            </button>
          );
        })}
      </div>

      {reports.length === 0 ? (
        <EmptyState icon={FileText} title={t("empty")} />
      ) : (
        <div className="space-y-3.5">
          {reports.map((r, idx) => (
            <article
              key={r.month}
              className="animate-slide-up rounded-xl border border-zinc-200 bg-white p-6 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <header className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <h2 className="text-lg font-semibold tracking-tight">
                    {r.month}
                  </h2>
                </div>
                {r.generated && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Sparkles className="h-3 w-3" />
                    {locale === "id" ? "Dihasilkan AI" : "AI Generated"}
                  </span>
                )}
              </header>
              <p className="text-[14px] leading-[1.7] text-zinc-600 dark:text-zinc-300">
                {r.body}
              </p>
              <div className="mt-4 flex items-center gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <span className="font-mono text-base font-semibold tabular-nums">
                  {formatCurrency(r.total, locale)}
                </span>
                <span className="text-xs text-zinc-400">total</span>
                <span
                  className={
                    "inline-flex items-center gap-1 text-xs font-semibold " +
                    (r.change < 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-500 dark:text-rose-400")
                  }
                >
                  {r.change < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  {r.change > 0 ? "+" : ""}
                  {r.change}%{" "}
                  <span className="font-normal text-zinc-400">
                    vs {locale === "id" ? "bulan lalu" : "prev"}
                  </span>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-12 rounded-full" />
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
