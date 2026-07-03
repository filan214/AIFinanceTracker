"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  MessageCircle,
  Settings,
  Search,
  ArrowRight,
  ChevronDown,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/supabase/auth-context";

type NavItem = {
  href: string;
  labelKey: "dashboard" | "transactions" | "reports" | "chat" | "settings";
  icon: LucideIcon;
  badge?: string;
};

const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/transactions", labelKey: "transactions", icon: Receipt },
  { href: "/reports", labelKey: "reports", icon: FileText },
  { href: "/chat", labelKey: "chat", icon: MessageCircle, badge: "AI" },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

function LogoMark({ size = 30 }: { size?: number }) {
  const inner = Math.round(size * 0.6);
  return (
    <div
      className="flex items-center justify-center bg-[var(--ink)] dark:bg-white"
      style={{
        width: size,
        height: size,
        borderRadius: size / 3.5,
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 18 L4 6 L10 14 L14 9 L20 18"
          stroke="var(--accent)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="6" r="2.2" fill="var(--accent)" />
      </svg>
    </div>
  );
}

export { LogoMark };

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tSidebar = useTranslations("sidebar");
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "—";
  const initial = displayName.charAt(0).toUpperCase();

  // Close the account menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await signOut();
    router.push("/");
  }

  return (
    <aside className="hidden h-screen w-60 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:flex"
      style={{ padding: "18px 14px" }}
    >
      <Link
        href="/dashboard"
        className="mb-6 flex items-center gap-2.5 px-2 py-1"
      >
        <LogoMark size={30} />
        <span className="text-sm font-semibold tracking-tight">
          {tCommon("appName")}
        </span>
      </Link>

      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <input
          placeholder={tSidebar("searchPlaceholder")}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-8 pr-3 text-xs text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <nav className="mb-6 flex flex-col gap-0.5">
        {NAV.map(({ href, labelKey, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all",
                active
                  ? "border border-zinc-200 bg-zinc-100 text-zinc-900 shadow-[var(--shadow-sm)] dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  : "border border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
              )}
            >
              <Icon className="h-[15px] w-[15px]" />
              <span className="flex-1">{t(labelKey)}</span>
              {badge && (
                <span className="rounded bg-emerald-50 px-1.5 py-px text-[9px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3.5">
        <div className="relative overflow-hidden rounded-[10px] bg-zinc-900 p-3.5 text-white dark:bg-zinc-800">
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-emerald-400">
            AI Tip
          </div>
          <p className="mb-2.5 text-xs leading-snug text-zinc-300">
            {tSidebar("aiTip")}
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
          >
            {tSidebar("seeHow")} <ArrowRight className="h-2.5 w-2.5" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              {tCommon("language")}
            </div>
            <LanguageToggle variant="segmented" className="w-full" />
          </div>
          <div>
            <div className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              {tCommon("theme")}
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div
          ref={menuRef}
          className="relative flex items-center gap-2.5 border-t border-zinc-100 px-2 pt-3 dark:border-zinc-800"
        >
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-emerald-500 text-xs font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-zinc-900 dark:text-zinc-100">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-zinc-400">
              {displayEmail}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={displayName}
            className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                menuOpen && "rotate-180"
              )}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="animate-fade-in absolute bottom-full right-0 mb-2 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-[var(--shadow-md)] dark:border-zinc-700 dark:bg-zinc-800"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t("logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
