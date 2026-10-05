"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "@/i18n/locale-provider";
import { formatDateShort } from "@/lib/format";
import type { Transaction } from "@/lib/mock-data";
import { CATEGORY_COLOR } from "@/lib/mock-data";
import { CategoryBadge, CATEGORY_ICON, CATEGORY_TEXT } from "@/components/category-badge";
import { cn } from "@/lib/cn";

// Column template shared with the transactions table header so each heading
// sits over the column it names. Below sm the category column is dropped and
// the category moves under the description.
export const TABLE_COLS_SM =
  "sm:grid-cols-[2.25rem_minmax(0,1fr)_10rem_8rem_2.75rem]";

export function TransactionRow({
  transaction,
  onClick,
  compact = false,
  showActions = false,
  onDelete,
}: {
  transaction: Transaction;
  onClick?: () => void;
  compact?: boolean;
  showActions?: boolean;
  onDelete?: () => void;
}) {
  const { locale } = useLocale();
  const tCat = useTranslations("categories");
  const tCommon = useTranslations("common");
  const isIncome = transaction.type === "income";
  const formatted = new Intl.NumberFormat(
    locale === "id" ? "id-ID" : "en-US",
    { maximumFractionDigits: 0 }
  ).format(transaction.amount);

  const color = CATEGORY_COLOR[transaction.category_key];
  const Icon = CATEGORY_ICON[transaction.category_key];

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
          ? cn("grid-cols-[2.25rem_minmax(0,1fr)_auto_2.75rem]", TABLE_COLS_SM)
          : "grid-cols-[2.25rem_minmax(0,1fr)_auto]"
      )}
    >
      <div
        className={cn("flex h-9 w-9 items-center justify-center rounded-[9px]", CATEGORY_TEXT)}
        style={{ "--cat": color, background: `${color}1a` } as React.CSSProperties}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
          {transaction.description}
        </p>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="shrink-0">{formatDateShort(transaction.date, locale)}</span>
          <span className={cn("flex min-w-0 items-center gap-1.5", showActions && "sm:hidden")}>
            <span aria-hidden className="text-zinc-300 dark:text-zinc-600">·</span>
            <span className="truncate">{tCat(transaction.category_key)}</span>
          </span>
        </div>
      </div>

      {showActions && (
        <div className="hidden sm:block">
          <CategoryBadge categoryKey={transaction.category_key} />
        </div>
      )}

      <span
        className={cn(
          "whitespace-nowrap text-right font-mono text-sm font-semibold tabular-nums",
          isIncome
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-zinc-900 dark:text-zinc-100"
        )}
      >
        {isIncome ? "+" : "−"}Rp {formatted}
      </span>

      {showActions && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          aria-label={tCommon("delete")}
          title={tCommon("delete")}
          className="flex h-9 w-9 items-center justify-center justify-self-end rounded-md text-zinc-400 transition-opacity hover:bg-rose-50 hover:text-rose-500 focus-visible:opacity-100 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 sm:opacity-0 sm:group-hover:opacity-100 [@media(hover:none)]:h-11 [@media(hover:none)]:w-11 [@media(hover:none)]:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
