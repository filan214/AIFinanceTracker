"use client";

import { Check, Database } from "lucide-react";
import { useTranslations } from "next-intl";

// Feature 5 — Context transparency card. Tells the user exactly what data the
// AI can see, shown as horizontal chips.
export function ContextCard() {
  const t = useTranslations("chat");
  const items = [t("context1"), t("context2"), t("context3"), t("context4")];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
        <Database className="h-3 w-3" />
        {t("contextLabel")}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"
          >
            <Check className="h-3 w-3 text-emerald-500" strokeWidth={3} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
