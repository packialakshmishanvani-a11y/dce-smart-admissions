import type { FaqGroup, VerificationLevel } from "./faq";

export type ChatRole = "user" | "assistant";

export interface ChatHistoryItem {
  role: ChatRole;
  content: string;
}

export interface ChatSource {
  faqId: string;
  question: string;
  url: string | null;
  /** Every source link on the FAQ entry (some cite both DCE and TNEA pages). */
  urls: string[];
  verificationLevel: VerificationLevel;
  verificationStatus: string;
}

/**
 * - ai: Gemini wrote the answer from retrieved FAQ entries
 * - faq-direct: Gemini unavailable/not configured; a strongly matching FAQ answer is returned verbatim
 * - fallback: no reliable answer; standard "couldn't verify" message
 */
export type ChatMode = "ai" | "faq-direct" | "fallback";

export interface ChatResponse {
  answer: string;
  answered: boolean;
  category: FaqGroup | "General";
  sourceUrl: string | null;
  needsReview: boolean;
  /** True when the assistant asked the student to clarify rather than answering. */
  clarification: boolean;
  /** Lowest trust level among the FAQ entries the answer relied on. */
  verification: VerificationLevel | null;
  sources: ChatSource[];
  /** Related FAQ questions the student can tap, shown when no direct answer was given. */
  related: { id: string; question: string }[];
  /** True only when the Make webhook confirmed receipt. */
  logged: boolean;
  mode: ChatMode;
}

export interface ChatErrorResponse {
  error: string;
  retryable: boolean;
}
