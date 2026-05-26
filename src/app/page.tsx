"use client";

import Link from "next/link";
import { Sparkles, Bot, LineChart, Globe2, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/80 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              {tCommon("appName")}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle variant="segmented" />
            <ThemeToggle />
            <Link
              href="/login"
              className="ml-2 hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 sm:block"
            >
              {t("navLogin")}
            </Link>
            <Link href="/register">
              <Button size="sm">{t("navStart")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                <Sparkles className="h-3 w-3" />
                AI-powered finance
              </div>
              <h1 className="text-balance text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
                {t("heroTitle")}
              </h1>
              <p className="mt-5 max-w-lg text-pretty text-base text-zinc-600 dark:text-zinc-400">
                {t("heroSubtitle")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register">
                  <Button size="lg">
                    {t("heroCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary">
                    {t("heroSecondary")}
                  </Button>
                </Link>
              </div>
            </div>

            <HeroMockup />
          </div>
        </section>

        <section className="border-y border-zinc-200/60 bg-white/50 dark:border-zinc-800/60 dark:bg-zinc-900/30">
          <div className="mx-auto grid max-w-6xl gap-px overflow-hidden bg-zinc-200 dark:bg-zinc-800 sm:grid-cols-3">
            <FeatureCard
              icon={Bot}
              title={t("feature1Title")}
              body={t("feature1Body")}
            />
            <FeatureCard
              icon={LineChart}
              title={t("feature2Title")}
              body={t("feature2Body")}
            />
            <FeatureCard
              icon={Globe2}
              title={t("feature3Title")}
              body={t("feature3Body")}
            />
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-zinc-500">
        {t("footer")}
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white p-8 dark:bg-zinc-950">
      <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
    </div>
  );
}

function HeroMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/0 to-emerald-500/5 blur-2xl" />
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl shadow-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-500">May 2026</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            +12% saved
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Income", value: "Rp 4.500.000", color: "emerald" },
            { label: "Expense", value: "Rp 2.340.000", color: "rose" },
            { label: "Balance", value: "Rp 2.160.000", color: "zinc" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
            >
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                {m.label}
              </p>
              <p className="mt-1 font-mono text-xs font-semibold tabular-nums">
                {m.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 h-28 rounded-lg bg-gradient-to-b from-emerald-500/20 to-transparent" />
        <div className="mt-4 space-y-2">
          {[
            { d: "Lunch at warung", c: "Food", a: "−Rp 35.000" },
            { d: "Grab to office", c: "Transport", a: "−Rp 22.000" },
            { d: "Netflix", c: "Entertainment", a: "−Rp 65.000" },
          ].map((r) => (
            <div
              key={r.d}
              className="flex items-center justify-between rounded-md border border-zinc-100 px-3 py-2 text-xs dark:border-zinc-800"
            >
              <div>
                <p className="font-medium">{r.d}</p>
                <p className="text-zinc-500">{r.c}</p>
              </div>
              <span className="font-mono tabular-nums">{r.a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
