"use client";

import { Fragment } from "react";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { parseChatMarkdown, type Inline } from "@/lib/chat-markdown";

function renderInline(content: Inline[]) {
  return content.map((part, i) =>
    part.style === "bold" ? (
      <strong key={i}>{part.text}</strong>
    ) : part.style === "italic" ? (
      <em key={i}>{part.text}</em>
    ) : (
      <Fragment key={i}>{part.text}</Fragment>
    )
  );
}

function AiContent({ content }: { content: string }) {
  return (
    <div className="space-y-2.5">
      {parseChatMarkdown(content).map((block, i) => {
        if (block.type === "p") return <p key={i}>{renderInline(block.content)}</p>;
        const items = block.items.map((item, j) => (
          <li key={j}>{renderInline(item)}</li>
        ));
        return block.type === "ol" ? (
          <ol key={i} start={block.start} className="list-decimal space-y-1.5 pl-5">
            {items}
          </ol>
        ) : (
          <ul key={i} className="list-disc space-y-1.5 pl-5">
            {items}
          </ul>
        );
      })}
    </div>
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
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[color:var(--accent-solid)] text-white">
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
                : "rounded-xl rounded-tr-none bg-[color:var(--accent-solid)] text-white"
          )}
        >
          {isAi ? <AiContent content={content} /> : content}
        </div>
      </div>
    </div>
  );
}
