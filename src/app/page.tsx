"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Bot,
  LineChart,
  Globe2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Area, ComposedChart, Line, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { DemoLoginButton } from "@/components/demo-login-button";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoMark } from "@/components/layout/sidebar";
import { CATEGORY_COLOR, type CategoryKey } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";
import { useLocale, type Locale } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";

export default function LandingPage() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark size={28} />
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
              <Button size="sm">
                {t("navStart")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
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
              <h1 className="text-balance font-semibold leading-tight tracking-tight" style={{ fontSize: "clamp(36px, 5vw, 64px)" }}>
                {t("heroTitle")}
              </h1>
              <p className="mt-5 max-w-lg text-pretty text-lg text-zinc-600 dark:text-zinc-400">
                {t("heroSubtitle")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register">
                  <Button size="lg" className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">
                    {t("heroCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary">
                    {t("heroSecondary")}
                  </Button>
                </Link>
                <DemoLoginButton variant="ghost" size="lg" />
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

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-[13px] text-zinc-500">
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
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
    </div>
  );
}

const HERO_DAILY = [
  { day: 1, current: 85, previous: 60 },
  { day: 2, current: 45, previous: 78 },
  { day: 3, current: 120, previous: 50 },
  { day: 4, current: 60, previous: 95 },
  { day: 5, current: 30, previous: 70 },
  { day: 6, current: 110, previous: 80 },
  { day: 7, current: 75, previous: 65 },
  { day: 8, current: 90, previous: 100 },
  { day: 9, current: 40, previous: 55 },
  { day: 10, current: 65, previous: 90 },
  { day: 11, current: 105, previous: 70 },
  { day: 12, current: 50, previous: 85 },
  { day: 13, current: 80, previous: 60 },
  { day: 14, current: 95, previous: 75 },
];

const HERO_CATEGORIES: { key: CategoryKey; pct: number }[] = [
  { key: "food", pct: 32 },
  { key: "bills", pct: 26 },
  { key: "transport", pct: 18 },
  { key: "shopping", pct: 14 },
  { key: "entertainment", pct: 10 },
];

const HERO_RECENT: { desc: string; cat: CategoryKey; amount: number }[] = [
  { desc: "Lunch at warung", cat: "food", amount: 35000 },
  { desc: "Grab to office", cat: "transport", amount: 22000 },
  { desc: "Netflix", cat: "entertainment", amount: 65000 },
];

const HERO_AI_EXAMPLES: { desc: string; cat: CategoryKey }[] = [
  { desc: "Kopi pagi", cat: "food" },
  { desc: "Grab ke kantor", cat: "transport" },
  { desc: "Spotify", cat: "entertainment" },
];

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function compactRp(n: number, locale: Locale): string {
  const v = (n / 1_000_000).toFixed(1);
  return locale === "id" ? `Rp ${v.replace(".", ",")} jt` : `Rp ${v}M`;
}

function HeroMockup() {
  const { locale } = useLocale();
  const tM = useTranslations("landing.mockup");
  const tCat = useTranslations("categories");

  const balance = useCountUp(2160000);
  const [mounted, setMounted] = useState(false);
  const [aiIdx, setAiIdx] = useState(0);
  const [toastVisible, setToastVisible] = useState(true);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const cycle = () => {
      setToastVisible(false);
      setTimeout(() => {
        setAiIdx((i) => (i + 1) % HERO_AI_EXAMPLES.length);
        setToastVisible(true);
      }, 250);
    };
    const id = setInterval(cycle, 3200);
    return () => clearInterval(id);
  }, []);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(2026, 4, 1)),
    [locale]
  );

  const ai = HERO_AI_EXAMPLES[aiIdx];

  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/0 to-emerald-500/5 blur-2xl" />

      <div className="absolute -right-2 -top-3 z-20 flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-lg dark:border-emerald-900/50 dark:bg-zinc-900 dark:text-emerald-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <Sparkles className="h-3 w-3" />
        {tM("aiBadge")}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/60 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="font-mono text-[11px] text-zinc-500" />
          <span className="text-xs text-zinc-400">⋯</span>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {tM("balance")} · {monthLabel}
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold leading-tight tabular-nums sm:text-3xl">
                {formatCurrency(Math.round(balance / 1000) * 1000, locale)}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <TrendingUp className="h-3 w-3" />
                  18%
                </span>
                <span className="text-zinc-500">{tM("vsLastMonth")}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <MiniStat
                label={tM("income")}
                value={"+" + compactRp(4500000, locale)}
                tone="emerald"
              />
              <MiniStat
                label={tM("expense")}
                value={"−" + compactRp(2340000, locale)}
                tone="rose"
              />
            </div>
          </div>

          <div className="mt-5 h-24">
            {mounted ? (
              <ResponsiveContainer>
                <ComposedChart
                  data={HERO_DAILY}
                  margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="current"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#heroFill)"
                    isAnimationActive
                    animationDuration={1200}
                  />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    stroke="#a1a1aa"
                    strokeDasharray="3 3"
                    strokeWidth={1.25}
                    dot={false}
                    isAnimationActive
                    animationDuration={1500}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : null}
          </div>

          <div className="mt-1 flex items-center gap-3 text-[10px] text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full bg-emerald-500" />
              {monthLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg
                width="12"
                height="2"
                viewBox="0 0 12 2"
                aria-hidden
                className="text-zinc-400"
              >
                <line
                  x1="0"
                  y1="1"
                  x2="12"
                  y2="1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              </svg>
              {tM("previousMonth")}
            </span>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {tM("byCategory")}
            </p>
            <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              {HERO_CATEGORIES.map((c, i) => (
                <div
                  key={c.key}
                  className="h-full transition-[width] duration-700 ease-out"
                  style={{
                    width: mounted ? `${c.pct}%` : "0%",
                    background: CATEGORY_COLOR[c.key],
                    transitionDelay: `${300 + i * 100}ms`,
                  }}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
              {HERO_CATEGORIES.slice(0, 3).map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: CATEGORY_COLOR[c.key] }}
                  />
                  {tCat(c.key)} · {c.pct}%
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {tM("recent")}
            </p>
            <ul className="space-y-1.5">
              {HERO_RECENT.map((r, i) => (
                <li
                  key={r.desc}
                  className="flex items-center justify-between gap-2 rounded-md border border-zinc-100 px-3 py-2 text-xs transition-all duration-500 ease-out dark:border-zinc-800"
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(6px)",
                    transitionDelay: `${600 + i * 120}ms`,
                  }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{
                        background: `${CATEGORY_COLOR[r.cat]}1f`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: CATEGORY_COLOR[r.cat] }}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {r.desc}
                      </p>
                      <p className="text-[10px] text-zinc-500">{tCat(r.cat)}</p>
                    </div>
                  </div>
                  <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                    −{formatCurrency(r.amount, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "absolute -bottom-4 -left-3 z-20 max-w-[270px] rounded-xl border border-zinc-200 bg-white p-3 shadow-xl transition-all duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-900",
          toastVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0"
        )}
        aria-live="polite"
      >
        <div className="flex items-start gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-zinc-900 dark:text-zinc-100">
              {tM("aiToastTitle")}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
              &ldquo;{ai.desc}&rdquo; →{" "}
              <span
                className="font-medium"
                style={{ color: CATEGORY_COLOR[ai.cat] }}
              >
                {tCat(ai.cat)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose";
}) {
  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-2.5 py-1 dark:border-zinc-800 dark:bg-zinc-800/40">
      <p className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "font-mono text-[11px] font-semibold tabular-nums",
          tone === "emerald"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-rose-600 dark:text-rose-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}
