"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ExpenseCategoryKey } from "@/lib/draft";
import { AmountInput } from "./amount-input";
import { Field, fieldClass } from "./field";

export function BudgetForm({
  categories,
  initial,
  onSubmit,
  onCancel,
}: {
  categories: ExpenseCategoryKey[];
  initial?: { category_key: ExpenseCategoryKey; amount: number };
  onSubmit: (category: ExpenseCategoryKey, amount: number) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("planning");
  const tCat = useTranslations("categories");
  const tCommon = useTranslations("common");
  const [category, setCategory] = useState<ExpenseCategoryKey>(
    initial?.category_key ?? categories[0]
  );
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const num = Number(amount) || 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (num <= 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(category, num); // parent unmounts the form on success
    } catch {
      setError(t("saveError"));
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("budgetCategory")}>
          <select
            value={category}
            disabled={!!initial}
            onChange={(e) => setCategory(e.target.value as ExpenseCategoryKey)}
            className={fieldClass}
          >
            {categories.map((k) => (
              <option key={k} value={k}>
                {tCat(k)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("budgetLimit")}>
          <AmountInput value={amount} onChange={setAmount} autoFocus />
        </Field>
      </div>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={num <= 0 || saving}>
          {tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
