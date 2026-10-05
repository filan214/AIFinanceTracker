"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { LogoMark } from "@/components/layout/sidebar";
import { cn } from "@/lib/cn";

export function MobileHeader() {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const onSettings = usePathname().startsWith("/settings");
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-1 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 lg:hidden">
      <Link href="/dashboard" className="flex min-h-11 items-center gap-2">
        <LogoMark size={26} />
        <span className="text-sm font-semibold">{t("appName")}</span>
      </Link>
      <div className="flex items-center gap-1">
        <LanguageToggle />
        <Link
          href="/settings"
          aria-label={tNav("settings")}
          title={tNav("settings")}
          aria-current={onSettings ? "page" : undefined}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800",
            onSettings ? "text-[color:var(--accent-fg)]" : "text-zinc-500 dark:text-zinc-400"
          )}
        >
          <Settings className="h-[18px] w-[18px]" />
        </Link>
      </div>
    </header>
  );
}
