"use client";

import { Calendar, Download, ChevronLeft, ChevronRight } from "lucide-react";

// Dark banner: month navigation, period meta, and PDF export.
export function ReportHeader({
  monthLabel,
  metaText,
  onPrev,
  onNext,
  canNext,
  onExport,
}: {
  monthLabel: string;
  metaText: string;
  onPrev: () => void;
  onNext: () => void;
  canNext: boolean;
  onExport: () => void;
}) {
  return (
    <div className="animate-slide-up flex items-center justify-between gap-3 rounded-xl bg-zinc-900 px-4 py-4 text-white dark:bg-zinc-800 sm:gap-4 sm:px-6 sm:py-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-1 print:hidden">
          <button
            onClick={onPrev}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 transition-colors hover:bg-white/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onNext}
            disabled={!canNext}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold leading-tight tracking-tight sm:text-[26px]">
            {monthLabel}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-white/50">
            <Calendar className="h-3.5 w-3.5" />
            {metaText}
          </p>
        </div>
      </div>
      <button
        onClick={onExport}
        title="Export PDF"
        aria-label="Export PDF"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70 transition-colors hover:bg-white/20 print:hidden"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}
