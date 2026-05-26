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

const ICON: Record<CategoryKey, LucideIcon> = {
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
  const Icon = ICON[categoryKey];
  const color = CATEGORY_COLOR[categoryKey];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: `${color}1a`,
        color,
      }}
    >
      {withIcon ? <Icon className="h-3 w-3" /> : null}
      {t(categoryKey)}
    </span>
  );
}
