"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { CHAT_PROMPTS } from "./suggested-prompts";

// Features 8 & 9 — input bar: auto-resizing textarea, keyboard hints,
// and a quick-action prompt dropdown.
export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (text: string) => void;
  disabled: boolean;
}) {
  const t = useTranslations("chat");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const [quickOpen, setQuickOpen] = useState(false);

  // Auto-resize up to ~5 lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  // Close the quick-action menu on outside click.
  useEffect(() => {
    if (!quickOpen) return;
    function onClick(e: MouseEvent) {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setQuickOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [quickOpen]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-end gap-2 rounded-2xl border border-zinc-300 bg-white px-3 py-2 focus-within:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800">
        {/* Quick actions */}
        <div ref={quickRef} className="relative mb-1 shrink-0">
          <button
            type="button"
            onClick={() => setQuickOpen((o) => !o)}
            aria-label={t("quickActions")}
            title={t("quickActions")}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-amber-500 dark:hover:bg-zinc-700"
          >
            <Zap className="h-4 w-4" />
          </button>
          {quickOpen && (
            <div className="absolute bottom-full left-0 z-10 mb-2 w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[var(--shadow-lg)] dark:border-zinc-700 dark:bg-zinc-800">
              <p className="border-b border-zinc-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-700">
                {t("quickActions")}
              </p>
              {CHAT_PROMPTS.slice(0, 3).map(({ titleKey, questionKey, Icon }) => (
                <button
                  key={titleKey}
                  type="button"
                  onClick={() => {
                    setQuickOpen(false);
                    onSubmit(t(questionKey));
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-emerald-50 dark:text-zinc-200 dark:hover:bg-emerald-900/20"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {t(titleKey)}
                </button>
              ))}
            </div>
          )}
        </div>

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("placeholder")}
          className="max-h-[120px] flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
        />

        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || disabled}
          className="mb-0.5 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("send")}</span>
        </button>
      </div>

      {/* Feature 8 — keyboard shortcut hints */}
      <div className="mt-1.5 flex items-center gap-2 px-1 text-[11px] text-zinc-400">
        <span>
          <kbd className="font-sans">⏎</kbd> {t("hintSend")}
        </span>
        <span>·</span>
        <span>
          <kbd className="font-sans">⇧⏎</kbd> {t("hintNewline")}
        </span>
      </div>
    </div>
  );
}
