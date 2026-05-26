"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Send, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { Skeleton } from "@/components/ui/skeleton";

type Msg = { id: string; role: "user" | "ai"; content: string };

export default function ChatPage() {
  const t = useTranslations("chat");
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPending(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "ai",
          content: t("mockReply"),
        },
      ]);
      setPending(false);
    }, 900);
  }

  if (loading) return <ChatSkeleton />;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4 lg:h-[calc(100vh-4rem)]">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {messages.length === 0 ? (
          <ChatEmpty onPick={(p) => send(p)} />
        ) : (
          <div className="space-y-5">
            {messages.map((m) => (
              <ChatBubble key={m.id} role={m.role} content={m.content} />
            ))}
            {pending ? (
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600 text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="animate-pulse">{t("aiLabel")}…</span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("placeholder")}
          className="flex-1 bg-transparent px-3 text-sm placeholder:text-zinc-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || pending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-emerald-600/40"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">{t("send")}</span>
        </button>
      </form>
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
      <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-1">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-left text-sm text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-4" aria-busy="true">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="flex-1 space-y-5 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex gap-3">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-12 w-2/3 rounded-2xl" />
        </div>
        <div className="flex justify-end gap-3">
          <Skeleton className="h-12 w-1/2 rounded-2xl" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-16 w-2/3 rounded-2xl" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
