"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/language-toggle";
import { LogoMark } from "@/components/layout/sidebar";

export function MobileHeader() {
  const t = useTranslations("common");
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <LogoMark size={26} />
        <span className="text-sm font-semibold">{t("appName")}</span>
      </Link>
      <div className="flex items-center gap-1">
        <LanguageToggle />
      </div>
    </header>
  );
}
