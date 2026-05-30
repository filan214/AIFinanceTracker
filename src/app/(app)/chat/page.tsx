"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { History, Sparkles, Trash2, RefreshCw } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { ContextCard } from "@/components/chat/context-card";
import {
  CategoryBreakdownChart,
  type CategoryBreakdownItem,
} from "@/components/chat/category-breakdown-chart";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/i18n/locale-provider";
import { useAuth } from "@/lib/supabase/auth-context";
import { cn } from "@/lib/cn";
import {
  listSessions,
  createSession,
  getSessionMessages,
  deleteSession,
  updateSessionTitle,
  type ChatSession,
} from "@/lib/chat/api";

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
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages, regenerate, error } =
    useChat({
      transport: new DefaultChatTransport({
        api: "/api/ai/chat",
        body: { language: locale },
      }),
    });

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "there";

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    listSessions().then(setSessions);
  }, []);

  // Prefill the composer when arriving from a deep link
  // (e.g. dashboard anomaly → /chat?q=Why+did+my...).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setInput(q);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  const isBusy = status === "submitted" || status === "streaming";

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    setInput("");

    let sid = activeSessionId;
    let isNew = false;
    if (!sid) {
      const created = await createSession();
      if (created) {
        sid = created.id;
        isNew = true;
        setActiveSessionId(created.id);
        setSessions((prev) => [created, ...prev]);
      }
    }

    sendMessage({ text: trimmed }, { body: { language: locale, sessionId: sid } });

    if (isNew && sid) {
      const newId = sid;
      updateSessionTitle(newId, trimmed, locale).then((title) => {
        if (title) {
          setSessions((prev) =>
            prev.map((s) => (s.id === newId ? { ...s, title } : s))
          );
        }
      });
    }
  }

  function newChat() {
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
  }

  async function selectSession(id: string) {
    setActiveSessionId(id);
    setMobileHistoryOpen(false);
    const rows = await getSessionMessages(id);
    setMessages(
      rows.map((m) => ({
        id: m.id,
        role: m.role,
        // Persisted assistant turns carry their full parts (tool outputs incl.
        // charts); older rows / user messages fall back to a plain text part.
        parts:
          m.parts && m.parts.length
            ? m.parts
            : [{ type: "text", text: m.content }],
      })) as UIMessage[]
    );
  }

  async function removeSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (id === activeSessionId) newChat();
    await deleteSession(id);
  }

  if (!mounted) return <ChatSkeleton />;

  return (
    <div className="flex h-[calc(100vh-9rem)] overflow-hidden lg:h-[calc(100vh-4rem)]">
      <ConversationSidebar
        className="hidden lg:flex"
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={selectSession}
        onNew={newChat}
        onDelete={removeSession}
      />

      <div
        className={cn(
          "fixed inset-0 z-30 lg:hidden",
          mobileHistoryOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileHistoryOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out",
            mobileHistoryOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileHistoryOpen(false)}
        />
        <ConversationSidebar
          className={cn(
            "absolute left-0 top-0 h-full transition-transform duration-300 ease-out",
            mobileHistoryOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
          )}
          sessions={sessions}
          activeId={activeSessionId}
          onSelect={selectSession}
          onNew={() => {
            newChat();
            setMobileHistoryOpen(false);
          }}
          onDelete={removeSession}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileHistoryOpen(true)}
              aria-label={t("history")}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 lg:hidden dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <History className="h-4 w-4" />
            </button>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold">{t("aiLabel")}</span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={newChat}
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
            <ChatEmpty onPick={submit} name={displayName} />
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
                        output?: unknown;
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
                      const breakdown =
                        name === "getCategoryBreakdown" &&
                        part.state === "output-available"
                          ? (part.output as {
                              breakdown?: CategoryBreakdownItem[];
                              total?: number;
                            })
                          : null;
                      return (
                        <Fragment key={i}>
                          <ToolIndicator
                            label={labelKey ? t(labelKey) : name}
                            running={isRunning}
                          />
                          {breakdown?.breakdown?.length ? (
                            <CategoryBreakdownChart
                              breakdown={breakdown.breakdown}
                              total={breakdown.total ?? 0}
                            />
                          ) : null}
                        </Fragment>
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
                    onClick={() =>
                      regenerate({
                        body: { language: locale, sessionId: activeSessionId },
                      })
                    }
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

        <ChatComposer
          value={input}
          onChange={setInput}
          onSubmit={submit}
          disabled={isBusy}
        />
      </div>
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

function ChatEmpty({
  onPick,
  name,
}: {
  onPick: (s: string) => void;
  name: string;
}) {
  const t = useTranslations("chat");
  return (
    <div className="mx-auto w-full max-w-2xl px-1 py-8 sm:py-10">
      <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        {t("greetingHi", { name })}
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
        {t("greetingHeading")}
      </h2>
      <p className="mt-2 max-w-md text-base text-zinc-500 dark:text-zinc-400">
        {t("greetingSubtitle")}
      </p>

      <div className="mt-6">
        <ContextCard />
      </div>

      <p className="mb-2.5 mt-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {t("greetingCta")}
      </p>
      <SuggestedPrompts onPick={onPick} />
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
