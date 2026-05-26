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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

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
              active
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-zinc-500"
            )}
          >
            <Icon className="h-5 w-5" />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
