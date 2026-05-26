"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/sidebar";
import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { locale, setLocale } = useLocale();

  const options: { value: "id" | "en"; flag: string; label: string }[] = [
    { value: "id", flag: "\u{1F1EE}\u{1F1E9}", label: tCommon("indonesian") },
    { value: "en", flag: "\u{1F1FA}\u{1F1F8}", label: tCommon("english") },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5">
          <LogoMark size={30} />
          <span className="text-sm font-semibold">{tCommon("appName")}</span>
        </div>

        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>

        <div className="mt-8 space-y-3">
          {options.map((o) => {
            const active = locale === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setLocale(o.value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors",
                  active
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">{o.flag}</span>
                  <span className="text-sm font-medium">{o.label}</span>
                </span>
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border",
                    active
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-zinc-300 dark:border-zinc-700"
                  )}
                >
                  {active ? <Check className="h-3 w-3" /> : null}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          size="lg"
          className="mt-8 w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          onClick={() => router.push("/dashboard")}
        >
          {t("continue")}
        </Button>
      </div>
    </div>
  );
}
