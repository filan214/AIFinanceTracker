"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORY_KEYS, type CategoryKey } from "@/lib/mock-data";

export type TransactionDraft = {
  amount: number;
  type: "income" | "expense";
  description: string;
  date: string;
  category_key: CategoryKey;
};

export function TransactionModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (t: TransactionDraft) => void;
}) {
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("categories");

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<CategoryKey>("food");

  useEffect(() => {
    if (open) {
      setType("expense");
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().slice(0, 10));
      setCategory("food");
    }
  }, [open]);

  if (!open) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!n || !description.trim()) return;
    onSave({
      amount: n,
      type,
      description: description.trim(),
      date,
      category_key: type === "income" ? "income" : category,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-zinc-900/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("modalTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label={tCommon("cancel")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-2">
            {(["expense", "income"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setType(opt)}
                className={
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors " +
                  (type === opt
                    ? opt === "income"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400")
                }
              >
                {opt === "income" ? t("typeIncome") : t("typeExpense")}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t("fieldAmount")}
            </label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              {t("fieldDescription")}
            </label>
            <Input
              type="text"
              placeholder={
                type === "income" ? "Salary" : "Lunch at warung"
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t("fieldDate")}
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {type === "expense" ? (
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {t("thCategory")}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryKey)}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {CATEGORY_KEYS.filter((k) => k !== "income").map((k) => (
                    <option key={k} value={k}>
                      {tCat(k)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit">{tCommon("save")}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
