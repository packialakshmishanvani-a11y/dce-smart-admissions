"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Banknote, Bot, Building2, Eraser, FileCheck2, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import type { ChatErrorResponse, ChatHistoryItem, ChatResponse } from "@/types/chat";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { PROMPT_CARDS, SUGGESTED_QUESTIONS, WELCOME, type UiMessage } from "./types";

const welcome: UiMessage = { id: "welcome", role: "assistant", kind: "welcome", content: WELCOME };
const CLIENT_TIMEOUT_MS = 25_000;

let counter = 0;
const nextId = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`;

function toHistory(messages: UiMessage[]): ChatHistoryItem[] {
  return messages
    .filter((m) => m.role === "user" || m.kind === "answer")
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }));
}

export function ChatWindow({ initialQuestion = "" }: { initialQuestion?: string }) {
  const [messages, setMessages] = useState<UiMessage[]>([welcome]);
  const [input, setInput] = useState(initialQuestion.slice(0, 500));
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = useCallback(
    async (raw: string, { retry = false }: { retry?: boolean } = {}) => {
      const question = raw.trim();
      if (!question || busy) return;

      const history = toHistory(messages);
      setBusy(true);
      setMessages((prev) => {
        // On retry, replace the error bubble instead of repeating the question.
        if (retry) {
          const last = prev.at(-1);
          return last?.role === "assistant" && last.kind === "error" ? prev.slice(0, -1) : prev;
        }
        return [...prev, { id: nextId(), role: "user", content: question }];
      });
      if (!retry) setInput("");

      const controller = new AbortController();
      abortRef.current = controller;
      const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: question, history }),
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => null)) as ChatResponse | ChatErrorResponse | null;

        if (!res.ok || !data || "error" in data) {
          const err = data && "error" in data ? data : { error: "The assistant couldn’t respond. Please try again.", retryable: true };
          setMessages((prev) => [...prev, { id: nextId(), role: "assistant", kind: "error", content: err.error, retryable: err.retryable, question }]);
        } else {
          setMessages((prev) => [...prev, { id: nextId(), role: "assistant", kind: "answer", content: data.answer, response: data }]);
        }
      } catch {
        if (controller.signal.aborted && abortRef.current !== controller) return; // unmounted or superseded
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            kind: "error",
            content: controller.signal.aborted ? "That took too long. Check your connection and try again." : "Couldn’t reach the assistant. Check your connection and try again.",
            retryable: true,
            question,
          },
        ]);
      } finally {
        clearTimeout(timer);
        setBusy(false);
      }
    },
    [busy, messages],
  );

  const clear = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setMessages([welcome]);
    setInput("");
    document.getElementById("chat-input")?.focus();
  };

  const onlyWelcome = messages.length === 1;

  const getPromptIcon = (title: string) => {
    if (title.includes("Program")) return <GraduationCap className="size-5 text-cyan-600" />;
    if (title.includes("Eligibility")) return <FileCheck2 className="size-5 text-emerald-600" />;
    if (title.includes("Hostel")) return <Building2 className="size-5 text-amber-600" />;
    return <Banknote className="size-5 text-indigo-600" />;
  };

  return (
    <section
      aria-labelledby="chat-heading"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-line/90 bg-slate-50/70 shadow-card backdrop-blur-sm sm:rounded-3xl"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 border-b border-line/80 bg-white/95 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative grid size-10 place-items-center rounded-2xl bg-gradient-to-tr from-cyan-700 via-cyan-600 to-navy-900 text-white shadow-md ring-2 ring-cyan-100">
            <Bot className="size-5" />
            <span className="absolute -bottom-0.5 -right-0.5 flex size-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 beacon-ping" />
              <span className="relative inline-flex size-3 rounded-full border-2 border-white bg-emerald-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 id="chat-heading" className="font-serif text-base font-bold text-navy-950 sm:text-lg">
                DCE Admissions AI
              </h1>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                Online
              </span>
            </div>
            <p className="text-xs text-muted">
              Anna University Affiliated • DCE Chennai Admissions FAQ Desk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1 rounded-lg border border-line bg-navy-50/60 px-2.5 py-1 text-xs font-medium text-muted md:flex">
            <ShieldCheck className="size-3.5 text-ok" />
            Reviewed FAQ Dataset
          </span>
          <button
            type="button"
            onClick={clear}
            disabled={onlyWelcome && !busy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line/80 bg-white px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-navy-50 hover:text-navy-900 disabled:opacity-40"
            title="Clear chat history"
          >
            <Eraser aria-hidden className="size-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Message scroll area */}
      <div
        ref={listRef}
        className="chat-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6"
        tabIndex={0}
        aria-label="Conversation"
      >
        <ol className="space-y-4" aria-live="polite" aria-relevant="additions">
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              busy={busy}
              onAsk={(q) => ask(q)}
              onRetry={(q) => ask(q, { retry: true })}
            />
          ))}

          {/* Three Dots Wave Bouncing Response Indicator */}
          {busy && (
            <li className="flex gap-2.5 sm:gap-3 animate-rise" aria-label="Assistant is answering">
              <div
                aria-hidden="true"
                className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-cyan-700 via-cyan-600 to-navy-900 text-white shadow-md ring-2 ring-cyan-100"
              >
                <Bot className="size-4 text-white" />
              </div>
              <div className="flex items-center gap-3 rounded-2xl rounded-tl-sm border border-line/90 bg-white px-4 py-3 shadow-card">
                <span className="flex items-center gap-1.5 py-0.5" aria-hidden="true">
                  <span className="typing-dot-1 size-2.5 rounded-full bg-cyan-600" />
                  <span className="typing-dot-2 size-2.5 rounded-full bg-cyan-500" />
                  <span className="typing-dot-3 size-2.5 rounded-full bg-navy-800" />
                </span>
                <span className="text-xs font-medium text-muted">
                  Searching verified DCE admissions answers…
                </span>
              </div>
            </li>
          )}
        </ol>

        {/* Welcome Empty State Cards */}
        {onlyWelcome && (
          <div className="mt-6 space-y-6 animate-rise">
            {/* Quick Cards Grid */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  <Sparkles className="size-3.5 text-cyan-600" />
                  Popular Admissions Topics
                </p>
                <span className="text-xs text-muted">Click any to ask immediately</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {PROMPT_CARDS.map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    disabled={busy}
                    onClick={() => ask(card.question)}
                    className="group flex items-start gap-3 rounded-2xl border border-line/80 bg-white p-3.5 text-left shadow-2xs transition-all hover:border-cyan-500 hover:bg-cyan-wash/40 hover:shadow-sm"
                  >
                    <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-navy-50/80 group-hover:bg-white group-hover:shadow-2xs transition-colors">
                      {getPromptIcon(card.title)}
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-sm text-navy-900 group-hover:text-cyan-ink transition-colors">
                          {card.title}
                        </span>
                        <span className="rounded bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                          {card.category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Questions */}
            <div className="rounded-2xl border border-line/80 bg-white p-4 shadow-2xs">
              <SuggestedQuestions
                label="Frequently Asked Questions"
                questions={SUGGESTED_QUESTIONS}
                onPick={(q) => ask(q)}
                disabled={busy}
              />
            </div>
          </div>
        )}
      </div>

      {/* Input Dock */}
      <div className="border-t border-line/80 bg-white/95 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 sm:px-6">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => ask(input)}
          busy={busy}
          onPickTopic={(q) => ask(q)}
        />
      </div>
    </section>
  );
}
