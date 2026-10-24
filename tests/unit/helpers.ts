import { vi } from "vitest";
import rawFaqs from "../../data/faqs.json";
import type { FaqEntry } from "@/types/faq";
import type { GeminiReply } from "@/lib/ai/gemini";
import type { AnswerDeps } from "@/lib/chat/answerQuestion";

export const faqs = rawFaqs as FaqEntry[];

export function reply(partial: Partial<GeminiReply>): GeminiReply {
  return { status: "answered", answer: "", usedFaqIds: [], category: "General", ...partial };
}

export function makeDeps(overrides: Partial<AnswerDeps> = {}) {
  const generate = vi.fn<AnswerDeps["generate"]>();
  const log = vi.fn<AnswerDeps["log"]>().mockResolvedValue({ ok: true });
  return { faqs, generate, log, ...overrides } as AnswerDeps & { generate: typeof generate; log: typeof log };
}
