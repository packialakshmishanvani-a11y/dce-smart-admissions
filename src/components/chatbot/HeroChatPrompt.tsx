"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Bot, Sparkles } from "lucide-react";
import { QUICK_TOPIC_PILLS } from "./types";

export function HeroChatPrompt() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    router.push(`/chat?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(query);
        }}
        className="relative flex items-center rounded-2xl border border-white/20 bg-white/10 p-2 shadow-xl backdrop-blur-md transition-all focus-within:border-cyan-400 focus-within:bg-white/15 focus-within:ring-2 focus-within:ring-cyan-400/30"
      >
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-600/30 text-cyan-300">
          <Bot className="size-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything (e.g. What courses does DCE offer?)"
          className="flex-1 bg-transparent px-3 text-sm text-white placeholder:text-white/60 focus:outline-hidden sm:text-base"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:from-cyan-400 hover:to-cyan-500 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
        >
          <span>Ask AI</span>
          <ArrowUp className="size-4" />
        </button>
      </form>

      {/* Suggested question chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-medium text-cyan-200/80">
          <Sparkles className="size-3 text-cyan-300" />
          Popular:
        </span>
        {QUICK_TOPIC_PILLS.slice(0, 4).map((pill) => (
          <button
            key={pill.label}
            type="button"
            onClick={() => handleSearch(pill.question)}
            className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur-xs transition-colors hover:border-cyan-400/60 hover:bg-white/15 hover:text-white"
          >
            {pill.label}
          </button>
        ))}
      </div>
    </div>
  );
}
