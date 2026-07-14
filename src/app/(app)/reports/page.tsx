"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/i18n/locale-provider";
import {
  fetchReportData,
  fetchCachedReport,
  generateAIReport,
} from "@/lib/api";
import type { AIReportContent, ReportData } from "@/types/report";
import { ReportHeader } from "./components/report-header";
import { MetricsRow } from "./components/metrics-row";
import { SummaryCard } from "./components/summary-card";
import { CategoryBreakdown } from "./components/category-breakdown";
import { TrendBarChart } from "./components/trend-bar-chart";
import { BiggestMovers } from "./components/biggest-movers";
import { HighlightsGrid } from "./components/highlights-grid";
import { AIRecommendations } from "./components/ai-recommendations";
import { ReportCTABar } from "./components/report-cta-bar";
import { SkeletonReport } from "./components/skeleton-report";

const FULL_EN = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const FULL_ID = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportsPage() {
  const t = useTranslations("reports");
  const tCat = useTranslations("categories");
  const { locale } = useLocale();

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [monthKey, setMonthKey] = useState(currentKey);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const [ai, setAi] = useState<AIReportContent | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchReportData(monthKey),
      fetchCachedReport(monthKey, locale),
    ])
      .then(([d, a]) => {
        if (cancelled) return;
        setData(d);
        setAi(a);
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setAi(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [monthKey, locale]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const content = await generateAIReport(monthKey, locale, false);
      setAi(content);
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  }

  function monthLabel(key: string): string {
    const [y, m] = key.split("-").map(Number);
    const names = locale === "id" ? FULL_ID : FULL_EN;
    return `${names[m - 1]} ${y}`;
  }

  function periodMeta(key: string): string {
    const [y, m] = key.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const names = locale === "id" ? FULL_ID : FULL_EN;
    return `1–${lastDay} ${names[m - 1]} ${y}`;
  }

  // Build and download the report as a PDF. jsPDF is lazy-loaded so it never
  // ships in the initial bundle — only when the user actually exports.
  async function handleExport() {
    if (!data) return;
    const { downloadReportPdf } = await import("@/lib/report-pdf");
    downloadReportPdf({
      data,
      ai,
      monthLabel: monthLabel(monthKey),
      periodMeta: periodMeta(monthKey),
      locale,
      t: t as unknown as (key: string) => string,
      tCat: tCat as unknown as (key: string) => string,
    });
  }

  if (loading) return <SkeletonReport />;

  const header = (
    <ReportHeader
      monthLabel={monthLabel(monthKey)}
      metaText={periodMeta(monthKey)}
      onPrev={() => setMonthKey((k) => shiftMonth(k, -1))}
      onNext={() => setMonthKey((k) => shiftMonth(k, 1))}
      canNext={monthKey < currentKey}
      onExport={handleExport}
    />
  );

  const hasData =
    !!data &&
    (data.metrics.totalSpent > 0 ||
      data.metrics.totalIncome > 0 ||
      data.categoryBreakdown.length > 0);

  if (!hasData) {
    return (
      <div className="space-y-4">
        {header}
        <EmptyState icon={FileText} title={t("emptyTitle")} subtitle={t("empty")} />
      </div>
    );
  }

  return (
    <div id="report-print-area" className="space-y-4">
      {header}
      <MetricsRow metrics={data.metrics} />
      <SummaryCard content={ai} generating={generating} onGenerate={handleGenerate} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryBreakdown categories={data.categoryBreakdown} />
        <TrendBarChart trend={data.monthlyTrend} currentMonth={monthKey} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BiggestMovers movers={data.biggestMovers} />
        <HighlightsGrid highlights={data.highlights} />
      </div>
      <AIRecommendations recommendations={ai?.recommendations ?? []} />
      <ReportCTABar monthLabel={monthLabel(monthKey)} />
    </div>
  );
}
