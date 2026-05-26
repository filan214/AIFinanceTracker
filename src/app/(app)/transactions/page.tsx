"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  MOCK_TRANSACTIONS,
  type CategoryKey,
  type Transaction,
} from "@/lib/mock-data";

export default function TransactionsPage() {
  const t = useTranslations("transactions");
  const tCat = useTranslations("categories");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | CategoryKey>("all");
  const [items, setItems] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(id);
  }, []);

  const filtered = useMemo(() => {
    return items.filter((t) => {
      if (category !== "all" && t.category_key !== category) return false;
      if (
        query &&
        !t.description.toLowerCase().includes(query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [items, query, category]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const key = t.date.slice(0, 7);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  function addTransaction(d: TransactionDraft) {
    const next: Transaction = {
      id: `local-${Date.now()}`,
      amount: d.amount,
      type: d.type,
      description: d.description,
      category_key: d.category_key,
      date: d.date,
    };
    setItems((prev) => [next, ...prev]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("addNew")}
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as "all" | CategoryKey)}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="all">{t("filterCategory")}</option>
          {CATEGORY_KEYS.map((k) => (
            <option key={k} value={k}>
              {tCat(k)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={tCommon("search") + "..."}
          subtitle="No transactions match your filters."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([month, list]) => (
            <section
              key={month}
              className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <header className="border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
                <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {month}
                </h3>
              </header>
              <div className="divide-y divide-zinc-100 px-2 dark:divide-zinc-800">
                {list.map((t) => (
                  <TransactionRow key={t.id} transaction={t} onClick={() => {}} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={addTransaction}
      />
    </div>
  );
}

const SKELETON_WIDTHS = ["w-48", "w-56", "w-40", "w-64"];

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
            <Skeleton className={`h-4 ${SKELETON_WIDTHS[i % 4]}`} />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
