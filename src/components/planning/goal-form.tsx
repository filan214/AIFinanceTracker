"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { GoalInput } from "@/lib/planning/api";
import { AmountInput } from "./amount-input";
import { Field, fieldClass } from "./field";

export function GoalForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: GoalInput;
  onSubmit: (input: GoalInput) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("planning");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(initial?.name ?? "");
  const [target, setTarget] = useState(initial ? String(initial.target_amount) : "");
  const [date, setDate] = useState(initial?.target_date ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const num = Number(target) || 0;
  const valid = name.trim().length > 0 && num > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), target_amount: num, target_date: date || null });
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
      <Field label={t("goalName")}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoFocus
          placeholder={t("goalNamePlaceholder")}
          className={fieldClass}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("goalTarget")}>
          <AmountInput value={target} onChange={setTarget} />
        </Field>
        <Field label={t("goalTargetDate")}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
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
