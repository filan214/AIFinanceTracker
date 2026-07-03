"use client";

import { Fragment } from "react";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

// Minimal inline markdown: turn **text** into <strong>. Splitting on a capture
// group leaves bold segments at odd indices — no markdown library needed.
function renderBold(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((segment, i) =>
    i % 2 === 1 ? (
      <strong key={i}>{segment}</strong>
    ) : (
      <Fragment key={i}>{segment}</Fragment>
    )
  );
}

export function ChatBubble({
  role,
  content,
  error,
}: {
  role: "user" | "ai";
  content: string;
  error?: boolean;
}) {
  const t = useTranslations("chat");
  const isAi = role === "ai";

  return (
    <div
      className={cn(
        "flex gap-2.5",
        isAi ? "justify-start" : "justify-end"
      )}
    >
      {isAi && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}
      <div className={cn("max-w-[80%]", isAi ? "" : "text-right")}>
        <p className="mb-1 text-[11px] font-medium text-zinc-400">
          {isAi ? t("aiLabel") : t("youLabel")}
        </p>
        <div
          className={cn(
            "px-4 py-2.5 text-sm leading-relaxed",
            isAi && error
              ? "rounded-xl rounded-tl-none border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300"
              : isAi
                ? "rounded-xl rounded-tl-none bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "rounded-xl rounded-tr-none bg-emerald-600 text-white"
          )}
        >
          {isAi ? renderBold(content) : content}
        </div>
      </div>
    </div>
  );
}
