"use client";

import { useLocale } from "@/i18n/locale-provider";
import { formatDateShort } from "@/lib/format";
import type { Transaction } from "@/lib/mock-data";
import { CategoryBadge } from "@/components/category-badge";
import { cn } from "@/lib/cn";

export function TransactionRow({
  transaction,
  onClick,
  compact = false,
}: {
  transaction: Transaction;
  onClick?: () => void;
  compact?: boolean;
}) {
  const { locale } = useLocale();
  const isIncome = transaction.type === "income";
  const formatted = new Intl.NumberFormat(
    locale === "id" ? "id-ID" : "en-US",
    { maximumFractionDigits: 0 }
  ).format(transaction.amount);

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        onClick && "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
        compact && "py-2"
      )}
    >
      <div className="hidden w-24 shrink-0 text-xs text-zinc-500 sm:block">
        {formatDateShort(transaction.date, locale)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
          {transaction.description}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <CategoryBadge categoryKey={transaction.category_key} />
          <span className="text-xs text-zinc-500 sm:hidden">
            {formatDateShort(transaction.date, locale)}
          </span>
        </div>
      </div>
      <div
        className={cn(
          "font-mono text-sm font-semibold tabular-nums",
          isIncome
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-zinc-900 dark:text-zinc-100"
        )}
      >
        {isIncome ? "+" : "−"}Rp {formatted}
      </div>
    </div>
  );
}
