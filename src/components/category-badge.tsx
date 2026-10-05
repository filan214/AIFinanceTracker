"use client";

import { useTranslations } from "next-intl";
import {
  UtensilsCrossed,
  Car,
  Film,
  ShoppingBag,
  Receipt,
  HeartPulse,
  GraduationCap,
  PiggyBank,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_COLOR, type CategoryKey } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

export const CATEGORY_ICON: Record<CategoryKey, LucideIcon> = {
  food: UtensilsCrossed,
  transport: Car,
  entertainment: Film,
  shopping: ShoppingBag,
  bills: Receipt,
  health: HeartPulse,
  education: GraduationCap,
  savings: PiggyBank,
  income: Wallet,
};

// The raw category colors fail AA as text on their own 10% tint (amber is
// 1.99:1 on white). Darken them in light mode and lighten them in dark mode,
// which keeps every pair above 5:1. Expects `--cat` set to the category color.
export const CATEGORY_TEXT =
  "text-[color:color-mix(in_srgb,var(--cat)_60%,black)] dark:text-[color:color-mix(in_srgb,var(--cat)_70%,white)]";

export function CategoryBadge({
  categoryKey,
  withIcon = true,
  className,
}: {
  categoryKey: CategoryKey;
  withIcon?: boolean;
  className?: string;
}) {
  const t = useTranslations("categories");
  const Icon = CATEGORY_ICON[categoryKey];
  const color = CATEGORY_COLOR[categoryKey];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        CATEGORY_TEXT,
        className
      )}
      style={{ "--cat": color, backgroundColor: `${color}1a` } as React.CSSProperties}
    >
      {withIcon ? <Icon className="h-3 w-3" /> : null}
      {t(categoryKey)}
    </span>
  );
}
