"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryBadge } from "@/components/category-badge";
import { useLocale } from "@/i18n/locale-provider";
import { TRANSACTIONS_CHANGED } from "@/lib/events";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { nextOccurrence, type RecurringRule } from "@/lib/recurring-due";
import { localToday } from "@/lib/ymd";
import {
  createRecurring,
  deleteRecurring,
  fetchRecurring,
  runRecurring,
  updateRecurring,
  type RuleInput,
} from "@/lib/planning/api";
import { ConfirmDelete } from "./confirm-delete";
import { ListSkeleton } from "./list-skeleton";
import { RecurringForm } from "./recurring-form";
import { Switch } from "./switch";

export function RecurringTab() {
  const t = useTranslations("planning");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();
  const [items, setItems] = useState<RecurringRule[] | null>(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<string | null>(null); // "new" or a rule id
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      setItems(await fetchRecurring());
    } catch {
      setError(true);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // A new/edited/re-activated rule may already have due dates: generate them now.
  async function catchUp() {
    try {
      const created = await runRecurring();
      if (created > 0) {
        window.dispatchEvent(new Event(TRANSACTIONS_CHANGED));
        setNotice(t("recurringAdded", { count: created }));
        setTimeout(() => setNotice(null), 4000);
      }
    } catch {
      // retried on next app open
    }
  }

  async function save(input: RuleInput) {
    if (editing && editing !== "new") await updateRecurring(editing, input);
    else await createRecurring(input);
    setEditing(null);
    await catchUp();
    await load();
  }

  async function toggle(rule: RecurringRule, active: boolean) {
    setItems((prev) => prev?.map((r) => (r.id === rule.id ? { ...r, active } : r)) ?? prev);
    await updateRecurring(rule.id, { active }).catch(() => {});
    if (active) await catchUp();
    await load();
  }

  async function remove(id: string) {
    await deleteRecurring(id).catch(() => {});
    await load();
  }

  const today = localToday();

  return (
    <div className="space-y-3.5">
      {notice && (
        <div
          role="status"
          className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
        >
          {notice}
        </div>
      )}
      {items !== null && items.length > 0 && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-3.5 w-3.5" />
            {t("addRecurring")}
          </Button>
        </div>
      )}
      {editing === "new" && <RecurringForm onSubmit={save} onCancel={() => setEditing(null)} />}

      {items === null ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{t("loadError")}</p>
      ) : items.length === 0 ? (
        editing === null && (
          <EmptyState
            icon={Repeat}
            title={t("recurringEmptyTitle")}
            subtitle={t("recurringEmptySub")}
            action={
              <Button size="sm" onClick={() => setEditing("new")}>
                <Plus className="h-3.5 w-3.5" />
                {t("addRecurring")}
              </Button>
            }
          />
        )
      ) : (
        <div className="animate-slide-up divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[var(--shadow-sm)] dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {items.map((r) => {
            if (editing === r.id) {
              return (
                <div key={r.id} className="p-3">
                  <RecurringForm
                    initial={r}
                    onSubmit={save}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              );
            }
            const next = nextOccurrence(r, today);
            return (
              <div
                key={r.id}
                className={cn("flex items-center gap-3 px-4 py-3", !r.active && "opacity-60")}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{r.description}</span>
                    <CategoryBadge categoryKey={r.category_key} className="hidden sm:inline-flex" />
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {t("everyDay", { day: r.day_of_month })}
                    {next ? ` · ${t("nextOn", { date: formatDate(next, locale) })}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 font-mono text-sm font-semibold",
                    r.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {r.type === "income" ? "+" : "-"}
                  {formatCurrency(r.amount, locale)}
                </span>
                <Switch
                  checked={r.active}
                  label={r.active ? t("active") : t("paused")}
                  onChange={(v) => toggle(r, v)}
                />
                <button
                  type="button"
                  onClick={() => setEditing(r.id)}
                  aria-label={tCommon("edit")}
                  className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <ConfirmDelete onConfirm={() => remove(r.id)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
