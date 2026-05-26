"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const tNav = useTranslations("nav");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(id);
  }, []);

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <Section title={t("profile")}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            F
          </div>
          <div>
            <p className="text-sm font-medium">Filan</p>
            <p className="text-xs text-zinc-500">demo@smartfinn.app</p>
          </div>
        </div>
      </Section>

      <Section title={t("preferences")}>
        <Row label="Language" desc={t("languageDesc")}>
          <LanguageToggle variant="segmented" />
        </Row>
      </Section>

      <Section title={t("appearance")}>
        <Row label="Theme" desc={t("themeDesc")}>
          <ThemeToggle variant="segmented" />
        </Row>
      </Section>

      <Section title={t("danger")} danger>
        <Row label={tNav("logout")} desc={t("logoutDesc")}>
          <Button variant="danger" size="sm" onClick={() => router.push("/")}>
            <LogOut className="h-4 w-4" />
            {tNav("logout")}
          </Button>
        </Row>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
  danger = false,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={
        "rounded-xl border bg-white p-6 shadow-sm dark:bg-zinc-900 " +
        (danger
          ? "border-rose-200 dark:border-rose-900/40"
          : "border-zinc-200 dark:border-zinc-800")
      }
    >
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
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
    <div className="space-y-6" aria-busy="true">
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
    </div>
  );
}
