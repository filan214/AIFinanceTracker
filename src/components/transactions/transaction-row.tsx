"use client";

import { Edit2, Trash2 } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { formatDateShort } from "@/lib/format";
import type { Transaction } from "@/lib/mock-data";
import { CATEGORY_COLOR } from "@/lib/mock-data";
import { CategoryBadge } from "@/components/category-badge";
import { cn } from "@/lib/cn";

export function TransactionRow({
  transaction,
  onClick,
  compact = false,
  showActions = false,
}: {
  transaction: Transaction;
  onClick?: () => void;
  compact?: boolean;
  showActions?: boolean;
}) {
  const { locale } = useLocale();
  const isIncome = transaction.type === "income";
  const formatted = new Intl.NumberFormat(
    locale === "id" ? "id-ID" : "en-US",
    { maximumFractionDigits: 0 }
  ).format(transaction.amount);

  const color = CATEGORY_COLOR[transaction.category_key];

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "group grid items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
        onClick && "cursor-pointer",
        compact && "py-2",
        showActions
          ? "grid-cols-[auto_1fr_auto_auto_auto]"
          : "grid-cols-[auto_1fr_auto]"
      )}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
        style={{ background: `${color}1a`, color }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
          {transaction.description}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-400">
          <span>{formatDateShort(transaction.date, locale)}</span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <CategoryBadge
            categoryKey={transaction.category_key}
            withIcon={false}
            className="px-0 py-0 text-[11px]"
          />
        </div>
      </div>

      {showActions && (
        <CategoryBadge categoryKey={transaction.category_key} className="hidden sm:inline-flex" />
      )}

      {showActions && (
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button className="rounded-md p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20 dark:hover:text-rose-400">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <span
        className={cn(
          "min-w-[120px] text-right font-mono text-sm font-semibold tabular-nums",
          isIncome
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-zinc-900 dark:text-zinc-100"
        )}
      >
        {isIncome ? "+" : "−"}Rp {formatted}
      </span>
    </div>
  );
}
