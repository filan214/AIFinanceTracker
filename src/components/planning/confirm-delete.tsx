"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

// Inline two-step delete (no window.confirm — it blocks browser automation).
export function ConfirmDelete({ onConfirm }: { onConfirm: () => void }) {
  const t = useTranslations("planning");
  const tCommon = useTranslations("common");
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        aria-label={tCommon("delete")}
        className="rounded-md p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="text-zinc-500">{t("confirmDelete")}</span>
      <button
        type="button"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
        className="rounded px-1.5 py-0.5 font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
      >
        {t("yes")}
      </button>
      <button
        type="button"
        onClick={() => setAsking(false)}
        className="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {t("no")}
      </button>
    </span>
  );
}
