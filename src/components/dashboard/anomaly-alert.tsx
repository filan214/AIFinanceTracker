"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function AnomalyAlert() {
  const [open, setOpen] = useState(true);
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  if (!open) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
      <div className="rounded-full bg-amber-100 p-1.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200">
          {t("anomalyTitle")}
        </h3>
        <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/80">
          {t("anomalyBody")}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label={tCommon("dismiss")}
        className="rounded-md p-1 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
