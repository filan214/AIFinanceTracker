"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/locale-provider";
import { importTransactions } from "@/lib/api";
import { parseCsv } from "@/lib/csv/parse";
import {
  findDuplicates,
  guessDateFormat,
  guessMapping,
  rowsToDrafts,
  type ColumnMapping,
  type DateFormat,
} from "@/lib/csv/map";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/cn";

const MAX_BYTES = 1_000_000;
const MAX_ROWS = 500;

const FIELDS: { key: keyof ColumnMapping; label: string }[] = [
  { key: "date", label: "fieldDate" },
  { key: "description", label: "fieldDescription" },
  { key: "amount", label: "fieldAmount" },
  { key: "debit", label: "fieldDebit" },
  { key: "credit", label: "fieldCredit" },
  { key: "type", label: "fieldType" },
];

const selectClass =
  "h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export function CsvImportModal({
  open,
  onClose,
  existing,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  existing: { date: string; amount: number; description: string }[];
  onImported: (count: number) => void;
}) {
  const t = useTranslations("csvImport");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [format, setFormat] = useState<DateFormat>("dmy");
  const [truncated, setTruncated] = useState(false);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [fileError, setFileError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  function reset() {
    setHeaders([]);
    setRows([]);
    setMapping(null);
    setTruncated(false);
    setExcluded(new Set());
    setFileError(null);
    setImportError(null);
  }

  useEffect(() => {
    if (open) reset();
  }, [open]);

  const drafts = useMemo(
    () => (mapping ? rowsToDrafts(rows, mapping, format) : []),
    [rows, mapping, format]
  );
  const duplicates = useMemo(() => findDuplicates(drafts, existing), [drafts, existing]);

  // Invalid rows and likely duplicates start unchecked whenever parsing
  // changes (file, mapping, or date format) — but NOT just because `existing`
  // reloaded (e.g. the recurring runner firing while this modal is open),
  // which would otherwise silently wipe the user's manual checkbox choices.
  useEffect(() => {
    setExcluded(new Set(drafts.filter((d) => d.error || duplicates.has(d.index)).map((d) => d.index)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts]);

  const selected = drafts.filter((d) => !d.error && !excluded.has(d.index));

  async function onFile(file: File | undefined) {
    if (!file) return;
    setFileError(null);
    if (file.size > MAX_BYTES) {
      setFileError(t("tooLarge"));
      return;
    }
    const all = parseCsv(await file.text());
    if (all.length < 2) {
      setFileError(t("empty"));
      return;
    }
    const [head, ...body] = all;
    const data = body.slice(0, MAX_ROWS);
    const guessed = guessMapping(head, data);
    setTruncated(body.length > MAX_ROWS);
    setHeaders(head);
    setRows(data);
    setMapping(guessed);
    setFormat(guessDateFormat(guessed.date === null ? [] : data.map((r) => r[guessed.date!] ?? "")));
  }

  function toggleRow(index: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function doImport() {
    if (selected.length === 0 || importing) return;
    setImporting(true);
    setImportError(null);
    try {
      const count = await importTransactions(
        selected.map((d) => ({
          date: d.date!,
          description: d.description,
          amount: d.amount,
          type: d.type,
        }))
      );
      onImported(count);
      onClose();
    } catch {
      setImportError(t("importError"));
    } finally {
      setImporting(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-zinc-900/50 animate-backdrop-in" onClick={onClose} />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-5">
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto flex max-h-[calc(100dvh-2.5rem)] w-full max-w-[760px] animate-modal-in flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[var(--shadow-lg)] dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between px-6 pb-2 pt-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
              <p className="mt-1 text-[13px] text-zinc-400">{t("subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={tCommon("cancel")}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {!mapping ? (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50">
                <Upload className="mb-2 h-6 w-6 text-zinc-400" />
                <span className="text-sm font-medium">{t("choose")}</span>
                <span className="mt-1 text-xs text-zinc-400">{t("hint")}</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </label>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {FIELDS.map((f) => (
                    <label key={f.key} className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                      {t(f.label)}
                      <select
                        value={mapping[f.key] ?? ""}
                        onChange={(e) =>
                          setMapping({
                            ...mapping,
                            [f.key]: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className={cn(selectClass, "mt-1 normal-case tracking-normal")}
                      >
                        <option value="">{t("none")}</option>
                        {headers.map((h, i) => (
                          <option key={i} value={i}>
                            {h || `#${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    {t("dateFormat")}
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as DateFormat)}
                      className={cn(selectClass, "mt-1 normal-case tracking-normal")}
                    >
                      <option value="dmy">DD/MM/YYYY</option>
                      <option value="mdy">MM/DD/YYYY</option>
                      <option value="ymd">YYYY-MM-DD</option>
                    </select>
                  </label>
                </div>

                {truncated && <p className="text-xs text-amber-600 dark:text-amber-400">{t("truncated")}</p>}

                <div className="max-h-[45vh] overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-white dark:bg-zinc-900">
                      <tr className="border-b border-zinc-200 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:border-zinc-800">
                        <th className="w-8 px-2 py-1.5" />
                        <th className="px-2 py-1.5 font-medium normal-case tracking-normal">{t("fieldDate")}</th>
                        <th className="px-2 py-1.5 font-medium normal-case tracking-normal">{t("fieldDescription")}</th>
                        <th className="px-2 py-1.5 text-right font-medium normal-case tracking-normal">{t("fieldAmount")}</th>
                        <th className="px-2 py-1.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {drafts.map((d) => {
                        const checked = !d.error && !excluded.has(d.index);
                        return (
                          <tr key={d.index} className={cn(d.error && "opacity-50")}>
                            <td className="w-8 px-2 py-1.5">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!!d.error}
                                onChange={() => toggleRow(d.index)}
                                className="h-4 w-4 accent-emerald-600"
                              />
                            </td>
                            <td className="whitespace-nowrap px-2 py-1.5 font-mono text-zinc-500">
                              {d.date ? formatDateShort(d.date, locale) : "—"}
                            </td>
                            <td className="max-w-[240px] truncate px-2 py-1.5">{d.description || "—"}</td>
                            <td
                              className={cn(
                                "whitespace-nowrap px-2 py-1.5 text-right font-mono",
                                d.type === "income"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              )}
                            >
                              {d.type === "income" ? "+" : "-"}
                              {formatCurrency(d.amount, locale)}
                            </td>
                            <td className="whitespace-nowrap px-2 py-1.5 text-right">
                              {d.error ? (
                                <span className="text-rose-600 dark:text-rose-400">
                                  {t(d.error === "date" ? "errDate" : d.error === "amount" ? "errAmount" : "errDescription")}
                                </span>
                              ) : duplicates.has(d.index) ? (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                  {t("duplicate")}
                                </span>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {fileError && <p className="text-sm text-rose-600 dark:text-rose-400">{fileError}</p>}
            {importError && <p className="text-sm text-rose-600 dark:text-rose-400">{importError}</p>}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <span className="text-xs text-zinc-500">
              {mapping ? t("selected", { count: selected.length }) : ""}
            </span>
            <div className="flex gap-2.5">
              {mapping && (
                <Button type="button" variant="secondary" size="sm" onClick={reset}>
                  {t("chooseAnother")}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                disabled={!mapping || selected.length === 0 || importing}
                onClick={doImport}
              >
                {importing ? t("importing") : t("importN", { count: selected.length })}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
