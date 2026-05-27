"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  Sparkles,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/i18n/locale-provider";
import { fetchReports, generateReport } from "@/lib/api";

const MONTHS_EN = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
const MONTHS_ID = [
  "Jan","Feb","Mar","Apr","Mei","Jun",
  "Jul","Agu","Sep","Okt","Nov","Des",
];
const FULL_EN = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const FULL_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

type Report = {
  id: string;
  content: string;
  language: string;
  month: string;
  created_at: string;
};

export default function ReportsPage() {
  const t = useTranslations("reports");
  const { locale } = useLocale();
  const now = new Date();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());

  const loadReports = useCallback(async () => {
    try {
      const data = await fetchReports();
      setReports(data);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const selectedMonthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
  const hasReport = reports.some((r) => r.month === selectedMonthKey);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateReport(locale, selectedMonthKey);
      await loadReports();
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  }

  function monthLabel(monthKey: string): string {
    const [y, m] = monthKey.split("-").map(Number);
    const names = locale === "id" ? FULL_ID : FULL_EN;
    return `${names[m - 1]} ${y}`;
  }

  if (loading) return <ReportsSkeleton />;

  const months = locale === "id" ? MONTHS_ID : MONTHS_EN;

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

      {!hasReport && (
        <div className="animate-slide-up flex items-center justify-between rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <div>
            <p className="text-sm font-medium">
              {locale === "id"
                ? `Belum ada laporan untuk ${monthLabel(selectedMonthKey)}`
                : `No report for ${monthLabel(selectedMonthKey)} yet`}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {locale === "id"
                ? "Buat laporan AI berdasarkan transaksi bulan ini."
                : "Generate an AI report based on this month's transactions."}
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {generating
              ? locale === "id"
                ? "Membuat..."
                : "Generating..."
              : locale === "id"
                ? "Buat Laporan"
                : "Generate Report"}
          </Button>
        </div>
      )}

      {reports.length === 0 && !generating ? (
        <EmptyState icon={FileText} title={t("empty")} />
      ) : (
        <div className="space-y-3.5">
          {reports.map((r, idx) => (
            <article
              key={r.id}
              className="animate-slide-up rounded-xl border border-zinc-200 bg-white p-6 shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <header className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  <h2 className="text-lg font-semibold tracking-tight">
                    {monthLabel(r.month)}
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <Sparkles className="h-3 w-3" />
                  {locale === "id" ? "Dihasilkan AI" : "AI Generated"}
                </span>
              </header>
              <p className="whitespace-pre-line text-[14px] leading-[1.7] text-zinc-600 dark:text-zinc-300">
                {r.content}
              </p>
              <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <span className="text-[11px] text-zinc-400">
                  {locale === "id" ? "Dibuat" : "Generated"}{" "}
                  {new Date(r.created_at).toLocaleDateString(
                    locale === "id" ? "id-ID" : "en-US",
                    { day: "numeric", month: "long", year: "numeric" }
                  )}
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
