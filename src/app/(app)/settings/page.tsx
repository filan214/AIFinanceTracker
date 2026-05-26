"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LogOut,
  Globe,
  Palette,
  Bell,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/cn";

const ACCENT_COLORS = ["#10b981", "#6366f1", "#f43f5e", "#f59e0b", "#3b82f6"];

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tNav = useTranslations("nav");
  const [loading, setLoading] = useState(true);
  const [anomalyAlerts, setAnomalyAlerts] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState(true);
  const [accentColor, setAccentColor] = useState("#10b981");
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(id);
  }, []);

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <Section title={t("profile")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              F
            </div>
            <div>
              <p className="text-sm font-medium">Filan</p>
              <p className="text-xs text-zinc-500">filan@example.com</p>
            </div>
          </div>
          <Button variant="secondary" size="sm">
            {t("editProfile")}
          </Button>
        </div>
      </Section>

      <Section title={t("languageSection")} icon={Globe}>
        <Row label={t("languageLabel")} desc={t("languageDesc")}>
          <LanguageToggle variant="segmented" />
        </Row>
      </Section>

      <Section title={t("appearance")} icon={Palette}>
        <Row label={t("themeLabel")} desc={t("themeDesc")}>
          <ThemeToggle variant="segmented" />
        </Row>
        <div className="my-3 border-t border-zinc-100 dark:border-zinc-800" />
        <Row label={t("accentLabel")} desc={t("accentDesc")}>
          <div className="flex gap-2">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setAccentColor(c)}
                className={cn(
                  "h-9 w-9 rounded-[10px] transition-all",
                  accentColor === c
                    ? "ring-2 ring-zinc-900 ring-offset-2 dark:ring-white"
                    : "ring-1 ring-zinc-200 hover:ring-zinc-400 dark:ring-zinc-700"
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </Row>
      </Section>

      <Section title={t("notifications")} icon={Bell}>
        <Row label={t("anomalyAlerts")} desc={t("anomalyAlertsDesc")}>
          <Toggle checked={anomalyAlerts} onChange={setAnomalyAlerts} />
        </Row>
        <div className="my-3 border-t border-zinc-100 dark:border-zinc-800" />
        <Row label={t("monthlyReportToggle")} desc={t("monthlyReportDesc")}>
          <Toggle checked={monthlyReport} onChange={setMonthlyReport} />
        </Row>
      </Section>

      <Section title={t("danger")} icon={AlertTriangle} danger>
        <Row label={t("deleteData")} desc={t("deleteDataDesc")}>
          <Button variant="danger" size="sm">
            <Trash2 className="h-3.5 w-3.5" />
            {t("deleteBtn")}
          </Button>
        </Row>
        <div className="my-3 border-t border-zinc-100 dark:border-zinc-800" />
        <Row label={tNav("logout")} desc={t("logoutDesc")}>
          <Button variant="secondary" size="sm" onClick={() => router.push("/")}>
            <LogOut className="h-3.5 w-3.5" />
            {tNav("logout")}
          </Button>
        </Row>
      </Section>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 rounded-full p-0.5 transition-colors",
        checked
          ? "bg-emerald-500"
          : "bg-zinc-300 dark:bg-zinc-600"
      )}
    >
      <span
        className={cn(
          "block h-4 w-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

function Section({
  title,
  children,
  danger = false,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
  icon?: typeof Globe;
}) {
  return (
    <section
      className={cn(
        "animate-slide-up rounded-xl border bg-white p-6 shadow-[var(--shadow-sm)] dark:bg-zinc-900",
        danger
          ? "border-rose-200 dark:border-rose-900/40"
          : "border-zinc-200 dark:border-zinc-800"
      )}
    >
      <h2 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <Skeleton className="mb-4 h-3 w-24" />
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
