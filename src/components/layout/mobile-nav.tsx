"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Receipt,
  Target,
  FileText,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

type NavItem = {
  href: string;
  labelKey: "dashboard" | "transactions" | "planning" | "reports" | "chat";
  icon: LucideIcon;
};

// Settings lives in the mobile header so Planning (budgets, goals) gets a tab.
const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/transactions", labelKey: "transactions", icon: Receipt },
  { href: "/planning", labelKey: "planning", icon: Target },
  { href: "/reports", labelKey: "reports", icon: FileText },
  { href: "/chat", labelKey: "chat", icon: MessageCircle },
];

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 lg:hidden">
      {NAV.map(({ href, labelKey, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium",
              active ? "text-[color:var(--accent-fg)]" : "text-zinc-500 dark:text-zinc-400"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5" />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
