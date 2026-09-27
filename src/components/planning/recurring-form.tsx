"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORY_KEYS, type ExpenseCategoryKey } from "@/lib/draft";
import type { TransactionType } from "@/lib/mock-data";
import type { RuleInput } from "@/lib/planning/api";
import { isValidYmd, localToday } from "@/lib/ymd";
import { AmountInput } from "./amount-input";
import { Field, fieldClass } from "./field";

export function RecurringForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: RuleInput;
  onSubmit: (input: RuleInput) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("planning");
  const tTx = useTranslations("transactions");
  const tCat = useTranslations("categories");
  const tCommon = useTranslations("common");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [category, setCategory] = useState<ExpenseCategoryKey>(
    initial && initial.category_key !== "income" ? initial.category_key : "bills"
  );
  const [day, setDay] = useState(String(initial?.day_of_month ?? new Date().getDate()));
  const [start, setStart] = useState(initial?.start_date ?? localToday());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const num = Number(amount) || 0;
  const dayNum = Number(day);
  const valid =
    description.trim().length > 0 &&
    num > 0 &&
    Number.isInteger(dayNum) &&
    dayNum >= 1 &&
    dayNum <= 31 &&
    isValidYmd(start);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        description: description.trim(),
        amount: num,
        type,
        category_key: type === "income" ? "income" : category,
        day_of_month: dayNum,
        start_date: start,
      });
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
      <Field label={t("recDescription")}>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={120}
          autoFocus
          placeholder={t("recDescriptionPlaceholder")}
          className={fieldClass}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("recAmount")}>
          <AmountInput value={amount} onChange={setAmount} />
        </Field>
        <Field label={t("recType")}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className={fieldClass}
          >
            <option value="expense">{tTx("typeExpense")}</option>
            <option value="income">{tTx("typeIncome")}</option>
          </select>
        </Field>
        {type === "expense" && (
          <Field label={t("recCategory")}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategoryKey)}
              className={fieldClass}
            >
              {EXPENSE_CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>
                  {tCat(k)}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={t("recDay")}>
          <input
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label={t("recStartDate")}>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={fieldClass} />
        </Field>
      </div>
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
