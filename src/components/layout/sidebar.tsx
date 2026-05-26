"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  MessageCircle,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  href: string;
  labelKey: "dashboard" | "transactions" | "reports" | "chat" | "settings";
  icon: LucideIcon;
};

const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/transactions", labelKey: "transactions", icon: Receipt },
  { href: "/reports", labelKey: "reports", icon: FileText },
  { href: "/chat", labelKey: "chat", icon: MessageCircle },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <aside className="hidden h-screen w-60 flex-col border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:flex">
      <Link
        href="/dashboard"
        className="mb-8 flex items-center gap-2 px-2 py-1"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">
          {tCommon("appName")}
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg px-2 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          F
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
            Filan
          </p>
          <p className="truncate text-xs text-zinc-500">demo@smartfinn.app</p>
        </div>
      </div>
    </aside>
  );
}
