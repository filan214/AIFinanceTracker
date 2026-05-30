"use client";

import { Info, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { ChatSession } from "@/lib/chat/api";

const TZ = "Asia/Jakarta";

function ymdInTz(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TZ });
}

type Group = "today" | "yesterday" | "older";

function groupFor(updatedAt: string): Group {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const d = ymdInTz(new Date(updatedAt));
  if (d === ymdInTz(today)) return "today";
  if (d === ymdInTz(yesterday)) return "yesterday";
  return "older";
}

// Feature 1 — conversation history sidebar. Feature 7 — privacy disclaimer.
export function ConversationSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  className,
}: {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  className?: string;
}) {
  const t = useTranslations("chat");

  const groups: { key: Group; labelKey: string; items: ChatSession[] }[] = [
    { key: "today", labelKey: "groupToday", items: [] },
    { key: "yesterday", labelKey: "groupYesterday", items: [] },
    { key: "older", labelKey: "groupOlder", items: [] },
  ];
  for (const s of sessions) {
    groups.find((g) => g.key === groupFor(s.updated_at))?.items.push(s);
  }

  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/40",
        className
      )}
    >
      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/10"
        >
          <Plus className="h-4 w-4" />
          {t("newChat")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {sessions.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-zinc-400">
            {t("noConversations")}
          </p>
        ) : (
          groups
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <div key={g.key} className="mb-3">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {t(g.labelKey)}
                </p>
                <div className="space-y-0.5">
                  {g.items.map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        "group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors",
                        s.id === activeId
                          ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200"
                          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(s.id)}
                        className="min-w-0 flex-1 truncate text-left"
                        title={s.title}
                      >
                        {s.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(s.id)}
                        aria-label={t("deleteChat")}
                        className="shrink-0 rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-200 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-zinc-700 dark:hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>

      <div className="flex items-start gap-2 border-t border-zinc-200 px-4 py-3 text-[11px] leading-relaxed text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        <span>
          {t("privacyLine1")} {t("privacyLine2")}
        </span>
      </div>
    </aside>
  );
}
