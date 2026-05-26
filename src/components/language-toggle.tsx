"use client";

import { Globe } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";

export function LanguageToggle({
  className,
  variant = "inline",
}: {
  className?: string;
  variant?: "inline" | "segmented";
}) {
  const { locale, setLocale } = useLocale();

  if (variant === "segmented") {
    return (
      <div
        className={cn(
          "inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900",
          className
        )}
      >
        {(["id", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              locale === l
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            )}
          >
            {l === "id" ? "ID" : "EN"}
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "id" ? "en" : "id")}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
        className
      )}
      aria-label="Toggle language"
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === "id" ? "ID" : "EN"}
    </button>
  );
}
