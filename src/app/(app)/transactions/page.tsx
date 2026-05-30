"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { TransactionRow } from "@/components/transactions/transaction-row";
import {
  TransactionModal,
  type TransactionDraft,
} from "@/components/transactions/transaction-modal";
import {
  CATEGORY_KEYS,
  type CategoryKey,
  type Transaction,
} from "@/lib/mock-data";
import {
  fetchTransactions,
  createTransaction as apiCreateTransaction,
  deleteTransaction as apiDeleteTransaction,
  categorizeTransaction,
} from "@/lib/api";

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const t = useTranslations("transactions");
  const tCat = useTranslations("categories");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | CategoryKey>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [items, setItems] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);

  const loadTransactions = useCallback(async () => {
    try {
      const res = await fetchTransactions({ limit: 500 });
      setItems(res.data as Transaction[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Pre-apply the category filter when arriving from a deep link
  // (e.g. dashboard anomaly → /transactions?category=entertainment).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("category");
    if (param && (CATEGORY_KEYS as string[]).includes(param)) {
      setCategory(param as CategoryKey);
    }
  }, []);

  const filtered = useMemo(() => {
    return items.filter((tx) => {
      if (category !== "all" && tx.category_key !== category) return false;
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (query && !tx.description.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [items, query, category, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [query, category, typeFilter]);

  async function addTransaction(d: TransactionDraft) {
    const tempId = `local-${Date.now()}`;
    const next: Transaction = {
      id: tempId,
      amount: d.amount,
      type: d.type,
      description: d.description,
      category_key: d.type === "income" ? "income" : "shopping",
      date: d.date,
    };
    setItems((prev) => [next, ...prev]);

    try {
      const created = await apiCreateTransaction(d);
      setItems((prev) =>
        prev.map((t) => (t.id === tempId ? { ...t, id: created.id } : t))
      );
      categorizeTransaction(created.id, d.description, d.type).then((cat) => {
        setItems((prev) =>
          prev.map((t) =>
            t.id === created.id ? { ...t, category_key: cat } : t
          )
        );
      });
    } catch {
      // keep optimistic local item
    }
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((t) => t.id !== id));
    try {
      await apiDeleteTransaction(id);
    } catch {
      loadTransactions();
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            {t("addNew")}
          </Button>
        }
      />

      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-zinc-200 bg-white/95 pb-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as "all" | CategoryKey)
          }
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <option value="all">{t("filterCategory")}</option>
          {CATEGORY_KEYS.map((k) => (
            <option key={k} value={k}>
              {tCat(k)}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as "all" | "income" | "expense")
          }
          className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <option value="all">{t("fieldType")}</option>
          <option value="income">{t("typeIncome")}</option>
          <option value="expense">{t("typeExpense")}</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("noResults")}
          subtitle={t("noResultsSub")}
          action={
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              {t("addNew")}
            </Button>
          }
        />
      ) : (
        <>
          <div className="animate-slide-up overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[var(--shadow-sm)] dark:border-zinc-800 dark:bg-zinc-900">
            <div className="hidden border-b border-zinc-100 px-5 py-2.5 sm:grid sm:grid-cols-[6rem_1fr_auto_8rem] sm:items-center sm:gap-3 dark:border-zinc-800">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                {t("thDate")}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                {t("thDescription")}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                {t("thCategory")}
              </span>
              <span className="text-right text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                {t("thAmount")}
              </span>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {paged.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  showActions
                  onDelete={() => handleDelete(tx.id)}
                />
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-600 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {tCommon("back")}
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page === totalPages}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-600 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {tCommon("next")}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addTransaction}
      />
    </div>
  );
}

const SKELETON_WIDTHS = [
  "w-48",
  "w-56",
  "w-40",
  "w-64",
  "w-52",
  "w-44",
  "w-60",
  "w-36",
];

function TableSkeleton() {
  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
      aria-busy="true"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_auto] items-center gap-3 px-2 py-3"
        >
          <div className="space-y-2">
            <Skeleton className={`h-4 ${SKELETON_WIDTHS[i % 8]}`} />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
