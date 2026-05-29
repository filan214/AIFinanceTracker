"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Send, Sparkles, Trash2, RefreshCw } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/i18n/locale-provider";

const TOOL_LABEL_KEYS: Record<string, string> = {
  getTransactions: "toolGetTransactions",
  getMonthlySummary: "toolGetMonthlySummary",
  getCategoryBreakdown: "toolGetCategoryBreakdown",
  getSpendingTrend: "toolGetSpendingTrend",
  getTopExpenses: "toolGetTopExpenses",
  getBalance: "toolGetBalance",
};

export default function ChatPage() {
  const t = useTranslations("chat");
  const tCommon = useTranslations("common");
  const { locale } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages, regenerate, error } =
    useChat({
      transport: new DefaultChatTransport({
        api: "/api/ai/chat",
        body: { language: locale },
      }),
    });

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  const isBusy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    setInput("");
    sendMessage({ text: trimmed });
  }

  if (!mounted) return <ChatSkeleton />;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col lg:h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold">{t("aiLabel")}</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <Trash2 className="h-3 w-3" />
            {tCommon("delete")}
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white p-5 dark:bg-zinc-900"
      >
        {messages.length === 0 ? (
          <ChatEmpty onPick={submit} />
        ) : (
          <div className="space-y-5">
            {messages.map((m) => {
              const text = m.parts
                .filter((p) => p.type === "text")
                .map((p) => (p as { text: string }).text)
                .join("");
              const toolParts = m.parts.filter(
                (p) =>
                  (typeof p.type === "string" && p.type.startsWith("tool-")) ||
                  p.type === "dynamic-tool"
              );
              return (
                <div key={m.id} className="space-y-2">
                  {toolParts.map((p, i) => {
                    const part = p as {
                      type: string;
                      toolName?: string;
                      state?: string;
                    };
                    const name =
                      part.toolName ||
                      (part.type.startsWith("tool-")
                        ? part.type.slice(5)
                        : "");
                    const labelKey = TOOL_LABEL_KEYS[name];
                    const isRunning =
                      part.state === "input-streaming" ||
                      part.state === "input-available";
                    return (
                      <ToolIndicator
                        key={i}
                        label={labelKey ? t(labelKey) : name}
                        running={isRunning}
                      />
                    );
                  })}
                  {text && (
                    <ChatBubble
                      role={m.role === "user" ? "user" : "ai"}
                      content={text}
                    />
                  )}
                </div>
              );
            })}
            {status === "submitted" && <TypingIndicator />}
            {status === "error" && (
              <div>
                <ChatBubble
                  role="ai"
                  content={error?.message || t("errorReply")}
                  error
                />
                <button
                  onClick={() => regenerate()}
                  className="ml-9 mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  <RefreshCw className="h-3 w-3" />
                  {t("retry")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex gap-2 border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("placeholder")}
          disabled={isBusy}
          className="h-10 flex-1 rounded-lg border border-zinc-200 bg-white px-4 text-sm placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none disabled:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:disabled:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={!input.trim() || isBusy}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-emerald-600/40"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">{t("send")}</span>
        </button>
      </form>
    </div>
  );
}

function ToolIndicator({ label, running }: { label: string; running: boolean }) {
  const t = useTranslations("chat");
  return (
    <div className="ml-9 inline-flex items-center gap-2 rounded-md bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
      {running ? (
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
      ) : (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
      )}
      <span>{running ? t("fetching", { label }) : t("fetched", { label })}</span>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-2.5 dark:bg-zinc-800">
        <span
          className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-zinc-400"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-zinc-400"
          style={{ animationDelay: "200ms" }}
        />
        <span
          className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-zinc-400"
          style={{ animationDelay: "400ms" }}
        />
      </div>
    </div>
  );
}

function ChatEmpty({ onPick }: { onPick: (s: string) => void }) {
  const t = useTranslations("chat");
  const suggestions = [t("suggest1"), t("suggest2"), t("suggest3")];
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
        <Sparkles className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold">{t("emptyTitle")}</h3>
      <p className="mt-1 text-sm text-zinc-500">{t("emptySubtitle")}</p>
      <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-3">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-xl border border-zinc-200 bg-white p-4 text-left text-sm text-zinc-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/10"
          >
            <Sparkles className="mb-2 h-4 w-4 text-emerald-500" />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col" aria-busy="true">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex-1 space-y-5 p-5">
        <div className="flex gap-3">
          <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
          <Skeleton className="h-12 w-2/3 rounded-2xl" />
        </div>
        <div className="flex justify-end gap-3">
          <Skeleton className="h-12 w-1/2 rounded-2xl" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
          <Skeleton className="h-16 w-2/3 rounded-2xl" />
        </div>
      </div>
      <Skeleton className="mx-3 mb-3 h-10 rounded-lg" />
    </div>
  );
}
