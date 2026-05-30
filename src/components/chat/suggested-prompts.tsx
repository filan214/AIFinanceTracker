"use client";

import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  RefreshCw,
  Target,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

type PromptDef = {
  titleKey: string;
  questionKey: string;
  Icon: LucideIcon;
  iconClass: string;
};

// Feature 6 — the six suggested prompts. Exported so the quick-action
// dropdown (Feature 9b) can reuse the first three.
export const CHAT_PROMPTS: PromptDef[] = [
  {
    titleKey: "promptBiggestTitle",
    questionKey: "promptBiggestQuestion",
    Icon: BarChart3,
    iconClass: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  },
  {
    titleKey: "promptSaveTitle",
    questionKey: "promptSaveQuestion",
    Icon: Zap,
    iconClass: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    titleKey: "promptFoodTitle",
    questionKey: "promptFoodQuestion",
    Icon: Utensils,
    iconClass: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  },
  {
    titleKey: "promptSubsTitle",
    questionKey: "promptSubsQuestion",
    Icon: RefreshCw,
    iconClass: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  },
  {
    titleKey: "promptCompareTitle",
    questionKey: "promptCompareQuestion",
    Icon: CalendarDays,
    iconClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    titleKey: "promptTargetTitle",
    questionKey: "promptTargetQuestion",
    Icon: Target,
    iconClass: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
];

export function SuggestedPrompts({ onPick }: { onPick: (q: string) => void }) {
  const t = useTranslations("chat");
  return (
    <div className="grid w-full gap-2.5 sm:grid-cols-2">
      {CHAT_PROMPTS.map(({ titleKey, questionKey, Icon, iconClass }) => (
        <button
          key={titleKey}
          type="button"
          onClick={() => onPick(t(questionKey))}
          className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/10"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t(titleKey)}
            </span>
            <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
              {t(questionKey)}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600" />
        </button>
      ))}
    </div>
  );
}
