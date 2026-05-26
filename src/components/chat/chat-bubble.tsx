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
            isAi
              ? "rounded-xl rounded-tl-none bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              : "rounded-xl rounded-tr-none bg-emerald-600 text-white"
          )}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
