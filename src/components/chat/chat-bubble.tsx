"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

export function ChatBubble({
  role,
  content,
}: {
  role: "user" | "ai";
  content: string;
}) {
  const t = useTranslations("chat");
  const isAi = role === "ai";

  return (
    <div
      className={cn(
        "flex gap-3",
        isAi ? "justify-start" : "justify-end"
      )}
    >
      {isAi ? (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      ) : null}
      <div className={cn("max-w-[80%]", isAi ? "" : "text-right")}>
        <p className="mb-1 text-xs font-medium text-zinc-500">
          {isAi ? t("aiLabel") : t("youLabel")}
        </p>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isAi
              ? "rounded-tl-sm bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              : "rounded-tr-sm bg-emerald-600 text-white"
          )}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
