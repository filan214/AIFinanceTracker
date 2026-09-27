"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { parseQuickText } from "@/lib/api";
import type { Draft } from "@/lib/draft";

// One-line natural-language input that fills the transaction form. Never saves.
export function SmartInput({ onDraft }: { onDraft: (d: Draft) => void }) {
  const t = useTranslations("smartInput");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fill() {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    try {
      onDraft(await parseQuickText(value));
      setText("");
    } catch {
      setError(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[10px] border border-emerald-200 bg-emerald-50/50 p-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <div className="mb-1.5 flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
        <Sparkles className="h-3 w-3" />
        {t("label")}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter would submit the surrounding transaction form.
            if (e.key === "Enter") {
              e.preventDefault();
              fill();
            }
          }}
          placeholder={t("placeholder")}
          maxLength={200}
          className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <Button
          type="button"
          size="sm"
          className="h-9"
          onClick={fill}
          disabled={busy || !text.trim()}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("fill")}
        </Button>
      </div>
      {error && (
        <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400">{error}</p>
      )}
    </div>
  );
}
