"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { runRecurring } from "@/lib/planning/api";
import { TRANSACTIONS_CHANGED } from "@/lib/events";

const SESSION_KEY = "sft:recurring-ran";

// Once per browser session, add any recurring transactions that came due.
export function RecurringRunner() {
  const t = useTranslations("planning");
  const [created, setCreated] = useState(0);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // storage blocked: still run, the server side is idempotent
    }
    runRecurring()
      .then((n) => {
        if (n > 0) {
          setCreated(n);
          window.dispatchEvent(new Event(TRANSACTIONS_CHANGED));
          setTimeout(() => setCreated(0), 4000);
        }
      })
      .catch((e) => console.error("recurring run failed", e));
  }, []);

  if (created === 0) return null;
  return (
    <div
      role="status"
      className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm text-white shadow-lg dark:bg-white dark:text-zinc-900 lg:bottom-6"
    >
      {t("recurringAdded", { count: created })}
    </div>
  );
}
