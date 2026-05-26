"use client";

import { useEffect, useState } from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CATEGORY_KEYS, type CategoryKey } from "@/lib/mock-data";
import { useLocale } from "@/i18n/locale-provider";
import { formatCurrency } from "@/lib/format";

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
  const { locale } = useLocale();

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

  const numAmount = Number(amount) || 0;
  const canSave = numAmount > 0 && description.trim().length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      amount: numAmount,
      type,
      description: description.trim(),
      date,
      category_key: type === "income" ? "income" : category,
    });
    onClose();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-zinc-900/50 animate-backdrop-in"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-5 pointer-events-none">
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-[460px] animate-modal-in rounded-2xl border border-zinc-200 bg-white shadow-[var(--shadow-lg)] dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between px-6 pb-2 pt-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("modalTitle")}
              </h2>
              <p className="mt-1 text-[13px] text-zinc-400">
                {locale === "id"
                  ? "AI akan otomatis mengkategorikan setelah disimpan."
                  : "AI will auto-categorize after saving."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form className="space-y-3.5 px-6 py-4" onSubmit={submit}>
            <div>
              <Label>{t("fieldType")}</Label>
              <div className="grid grid-cols-2 gap-2 rounded-[9px] bg-zinc-100 p-1 dark:bg-zinc-800">
                {(["expense", "income"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setType(opt)}
                    className={
                      "rounded-[7px] px-3 py-2 text-[13px] font-medium transition-all " +
                      (type === opt
                        ? "bg-white shadow-[var(--shadow-sm)] dark:bg-zinc-700 " +
                          (opt === "expense"
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400")
                        : "text-zinc-400")
                    }
                  >
                    {opt === "income" ? t("typeIncome") : t("typeExpense")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>{t("fieldAmount")}</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-medium text-zinc-400">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="0"
                  autoFocus
                  className="h-12 w-full rounded-[9px] border border-zinc-200 bg-white pl-10 pr-3 font-mono text-lg font-semibold text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              {numAmount > 0 && (
                <div className="mt-1.5 animate-fade-in font-mono text-xs text-zinc-400">
                  = {formatCurrency(numAmount, locale)}
                </div>
              )}
            </div>

            <div>
              <Label>{t("fieldDescription")}</Label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  locale === "id"
                    ? "mis. Kopi pagi di Kopi Tuku"
                    : "e.g. Morning coffee at Kopi Tuku"
                }
                className="h-10 w-full rounded-[9px] border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-400">
                <Sparkles className="h-2.5 w-2.5" />
                {locale === "id"
                  ? "AI akan otomatis memilih kategori dari deskripsi ini."
                  : "AI will pick a category from this description."}
              </div>
            </div>

            <div>
              <Label>{t("fieldDate")}</Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-full rounded-[9px] border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            <div className="flex justify-end gap-2.5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!canSave}
                className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                {tCommon("save")} <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
      {children}
    </div>
  );
}
