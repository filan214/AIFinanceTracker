"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function ReportsPage() {
  const t = useTranslations("reports");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(id);
  }, []);

  if (loading) return <ReportsSkeleton />;

  const reports = [
    { month: t("sampleMonth"), body: t("sampleBody") },
    { month: t("olderMonth"), body: t("olderBody") },
    { month: t("oldestMonth"), body: t("oldestBody") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {reports.length === 0 ? (
        <EmptyState icon={FileText} title={t("empty")} />
      ) : (
        <div className="space-y-4">
          {reports.map((r, idx) => (
            <article
              key={r.month}
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <header className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">
                  {r.month}
                </h2>
                {idx === 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Sparkles className="h-3 w-3" />
                    Latest
                  </span>
                ) : null}
              </header>
              <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                {r.body}
              </p>
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
