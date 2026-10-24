"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, CornerDownLeft, Sparkles } from "lucide-react";
import { MAX_MESSAGE_LENGTH } from "@/lib/validation/chatSchema";
import { QUICK_TOPIC_PILLS } from "./types";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  busy,
  onPickTopic,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  onPickTopic?: (q: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Grow with content up to ~5 lines.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  const remaining = MAX_MESSAGE_LENGTH - value.length;
  const canSend = !busy && value.trim().length > 0 && remaining >= 0;

  return (
    <div className="w-full">
      {/* Quick topic pills */}
      {onPickTopic && (
        <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-muted shrink-0 pl-1">
            <Sparkles className="size-3 text-cyan-600" />
            Quick:
          </span>
          {QUICK_TOPIC_PILLS.map((pill) => (
            <button
              key={pill.label}
              type="button"
              disabled={busy}
              onClick={() => onPickTopic(pill.question)}
              className="shrink-0 rounded-full border border-line/80 bg-white/90 px-2.5 py-1 text-[12px] font-medium text-navy-900 shadow-2xs backdrop-blur transition-all hover:border-cyan-500 hover:bg-cyan-wash hover:text-cyan-ink hover:shadow-xs disabled:opacity-50"
            >
              {pill.label}
            </button>
          ))}
        </div>
      )}

      <form
        className="relative flex items-end gap-2 rounded-2xl border border-line/90 bg-white p-2 shadow-sm transition-all focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-500/20 sm:p-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSend) onSubmit();
        }}
      >
        <div className="flex-1">
          <label htmlFor="chat-input" className="sr-only">
            Type your admissions question
          </label>
          <textarea
            id="chat-input"
            ref={ref}
            rows={1}
            value={value}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (canSend) onSubmit();
              }
            }}
            placeholder="Ask about DCE courses, TNEA cutoffs, hostel, fees, documents…"
            aria-describedby="chat-input-hint"
            className="block min-h-11 w-full resize-none border-0 bg-transparent px-2.5 py-2 text-sm leading-6 text-navy-950 placeholder:text-muted/70 focus:outline-hidden sm:text-base"
          />
        </div>

        <button
          type="submit"
          disabled={!canSend}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-cyan-700 via-cyan-600 to-navy-900 text-white shadow-sm transition-all hover:opacity-95 hover:shadow hover:scale-[1.03] active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-none disabled:bg-navy-100 disabled:text-muted disabled:scale-100"
          title="Send question"
        >
          <ArrowUp className="size-5" />
          <span className="sr-only">Send question</span>
        </button>
      </form>

      <div id="chat-input-hint" className="mt-1.5 flex items-center justify-between px-2 text-[11px] text-muted">
        <span className="flex items-center gap-1">
          <CornerDownLeft className="size-3 text-muted/70" />
          Enter to send • Shift + Enter for new line
        </span>
        <span aria-live="polite">{remaining <= 60 ? `${remaining} chars left` : ""}</span>
      </div>
    </div>
  );
}
