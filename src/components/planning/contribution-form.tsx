"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ContributionInput } from "@/lib/planning/api";
import { isValidYmd, localToday } from "@/lib/ymd";
import { AmountInput } from "./amount-input";
import { Field, fieldClass } from "./field";

export function ContributionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: ContributionInput) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("planning");
  const tCommon = useTranslations("common");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(localToday());
  const [recordAsExpense, setRecordAsExpense] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const num = Number(amount) || 0;
  const valid = num > 0 && isValidYmd(date);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ amount: num, date, record_as_expense: recordAsExpense });
    } catch {
      setError(t("saveError"));
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("topUpAmount")}>
          <AmountInput value={amount} onChange={setAmount} autoFocus />
        </Field>
        <Field label={t("topUpDate")}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={recordAsExpense}
          onChange={(e) => setRecordAsExpense(e.target.checked)}
          className="h-4 w-4 accent-emerald-600"
        />
        {t("recordAsExpense")}
      </label>
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={!valid || saving}>
          {tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
