"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";

const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function MonthPicker({
  monthIdx,
  year,
  onChange,
}: {
  monthIdx: number;
  year: number;
  onChange: (monthIdx: number) => void;
}) {
  const { locale } = useLocale();
  const months = locale === "id" ? MONTHS_ID : MONTHS_EN;

  return (
    <div className="inline-flex items-center overflow-hidden rounded-[9px] border border-zinc-200 bg-white shadow-[var(--shadow-sm)] dark:border-zinc-700 dark:bg-zinc-900">
      <button
        onClick={() => onChange(monthIdx - 1)}
        className="border-r border-zinc-200 px-2.5 py-[7px] text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-[140px] px-3.5 py-[7px] text-center text-[13px] font-medium">
        {months[monthIdx]} {year}
      </div>
      <button
        onClick={() => onChange(monthIdx + 1)}
        className="border-l border-zinc-200 px-2.5 py-[7px] text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
