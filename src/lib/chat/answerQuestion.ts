import type { ChatHistoryItem, ChatResponse, ChatSource } from "@/types/chat";
import type { FaqEntry, FaqGroup, VerificationLevel } from "@/types/faq";
import { isStrongMatch, retrieveFaqs, tokenize, type RetrievedFaq } from "@/lib/faq/retrieveFaqs";
import {
  OUT_OF_SCOPE_MESSAGE,
  PROMPT_CANARY,
  UNVERIFIED_MESSAGE,
  UNVERIFIED_NOTICE,
  buildContents,
  type GeminiContent,
} from "@/lib/ai/prompts";
import { GeminiError, type GeminiReply } from "@/lib/ai/gemini";
import type { LogOutcome } from "@/lib/integrations/makeWebhook";
import { containsSecretLikeText } from "@/lib/security/redact";

export interface AnswerDeps {
  faqs: FaqEntry[];
  generate: (contents: GeminiContent[]) => Promise<GeminiReply>;
  log: (input: { question: string; category: string; sourceChecked: string | null; chatbotResponse: string }) => Promise<LogOutcome>;
}

export type AnswerResult =
  | { ok: true; response: ChatResponse }
  | { ok: false; status: 503; error: string; retryable: true };

const MAX_ANSWER_CHARS = 1500;
const MAX_CLARIFY_CHARS = 400;
const TRUST_ORDER: VerificationLevel[] = ["unverified", "partial", "policy", "verified"];

function weakest(levels: VerificationLevel[]): VerificationLevel | null {
  if (levels.length === 0) return null;
  return levels.reduce((a, b) => (TRUST_ORDER.indexOf(a) <= TRUST_ORDER.indexOf(b) ? a : b));
}

function toSource(e: FaqEntry): ChatSource {
  return { faqId: e.id, question: e.question, url: e.sourceUrl, urls: e.sourceUrls, verificationLevel: e.verificationLevel, verificationStatus: e.verificationStatus };
}

/** Makes sure an unverified answer says so, without repeating a caveat it already carries. */
function withUnverifiedCaveat(answer: string): string {
  return /verif|confirm/i.test(answer) ? answer : `${answer}\n\n${UNVERIFIED_NOTICE}`;
}

/** Retrieves on the message alone, then also with the previous question for short follow-ups. */
export function retrieveForConversation(message: string, history: ChatHistoryItem[], faqs: FaqEntry[]): RetrievedFaq[] {
  const direct = retrieveFaqs(message, faqs);
  if (isStrongMatch(direct[0])) return direct;

  const previous = [...history].reverse().find((h) => h.role === "user")?.content;
  if (!previous) return direct;

  const merged = new Map(direct.map((r) => [r.entry.id, r]));
  for (const r of retrieveFaqs(`${previous} ${message}`, faqs)) {
    // Context-assisted matches rank slightly below direct ones.
    const scored = { ...r, score: r.score * 0.9 };
    const existing = merged.get(r.entry.id);
    if (!existing || existing.score < scored.score) merged.set(r.entry.id, scored);
  }
  return [...merged.values()].sort((a, b) => b.score - a.score).slice(0, 4);
}

interface Draft {
  answer: string;
  answered: boolean;
  clarification: boolean;
  needsReview: boolean;
  used: FaqEntry[];
  category: FaqGroup | "General";
  mode: ChatResponse["mode"];
}

function fallbackDraft(results: RetrievedFaq[], mode: ChatResponse["mode"]): Draft {
  return {
    answer: UNVERIFIED_MESSAGE,
    answered: false,
    clarification: false,
    needsReview: true,
    used: [],
    category: results[0]?.entry.group ?? "General",
    mode,
  };
}

function outOfScopeDraft(mode: ChatResponse["mode"]): Draft {
  return { answer: OUT_OF_SCOPE_MESSAGE, answered: false, clarification: false, needsReview: false, used: [], category: "General", mode };
}

function faqDirectDraft(entry: FaqEntry): Draft {
  const unverified = entry.verificationLevel === "unverified";
  return {
    answer: unverified ? withUnverifiedCaveat(entry.answer) : entry.answer,
    answered: !unverified,
    clarification: false,
    needsReview: unverified,
    used: [entry],
    category: entry.group,
    mode: "faq-direct",
  };
}

/** Turns the model's structured reply into a safe draft, distrusting anything it can't back up. */
function draftFromReply(reply: GeminiReply, results: RetrievedFaq[]): Draft {
  const answerText = reply.answer.trim();

  if (answerText.includes(PROMPT_CANARY) || containsSecretLikeText(answerText)) {
    console.warn("[chat] discarded a model reply that echoed internal configuration");
    return outOfScopeDraft("ai");
  }

  switch (reply.status) {
    case "out_of_scope":
      return outOfScopeDraft("ai");

    case "clarify":
      return {
        answer: answerText.slice(0, MAX_CLARIFY_CHARS) || "Could you tell me a little more about what you’d like to know?",
        answered: false,
        clarification: true,
        needsReview: false,
        used: [],
        category: results[0]?.entry.group ?? reply.category,
        mode: "ai",
      };

    case "cannot_verify":
      return fallbackDraft(results, "ai");

    case "answered": {
      const retrieved = new Map(results.map((r) => [r.entry.id, r.entry]));
      const used = [...new Set(reply.usedFaqIds)].map((id) => retrieved.get(id)).filter((e): e is FaqEntry => !!e);
      // An "answer" that cites nothing we supplied is unsupported, however confident it sounds.
      if (used.length === 0 || !answerText) return fallbackDraft(results, "ai");

      const unverified = weakest(used.map((e) => e.verificationLevel)) === "unverified";
      const text = answerText.slice(0, MAX_ANSWER_CHARS);
      return {
        answer: unverified ? withUnverifiedCaveat(text) : text,
        answered: !unverified,
        clarification: false,
        needsReview: unverified,
        used,
        category: used[0].group,
        mode: "ai",
      };
    }
  }
}

export async function answerQuestion(message: string, history: ChatHistoryItem[], deps: AnswerDeps): Promise<AnswerResult> {
  const results = retrieveForConversation(message, history, deps.faqs);
  const hasSearchableTerms = tokenize(message).length > 0;

  let draft: Draft;
  try {
    const reply = await deps.generate(buildContents(message, history, results));
    draft = draftFromReply(reply, results);
  } catch (err) {
    const kind = err instanceof GeminiError ? err.kind : "upstream";
    if (kind !== "not_configured") console.warn(`[chat] Gemini unavailable: ${kind}`);

    if (isStrongMatch(results[0])) {
      // A strong FAQ match can be shown verbatim without the model.
      draft = faqDirectDraft(results[0].entry);
    } else if (kind === "not_configured") {
      draft = hasSearchableTerms ? fallbackDraft(results, "fallback") : outOfScopeDraft("fallback");
    } else {
      // Temporary failure on a question we might be able to answer: ask the student to retry, don't log.
      return {
        ok: false,
        status: 503,
        retryable: true,
        error:
          kind === "quota"
            ? "The assistant is handling a lot of questions right now. Please try again in a minute."
            : "The assistant couldn’t respond just now. Please try again.",
      };
    }
  }

  const usedIds = new Set(draft.used.map((e) => e.id));
  const related =
    draft.answered && !draft.needsReview
      ? []
      : results.filter((r) => !usedIds.has(r.entry.id)).slice(0, 3).map((r) => ({ id: r.entry.id, question: r.entry.question }));

  let logged = false;
  if (draft.needsReview) {
    try {
      const outcome = await deps.log({
        question: message,
        category: draft.category,
        sourceChecked: draft.used[0]?.sourceUrl ?? results[0]?.entry.sourceUrl ?? null,
        chatbotResponse: draft.answer,
      });
      logged = outcome.ok;
    } catch {
      // Logging is best-effort; the student still gets their answer.
      console.warn("[chat] review logging threw unexpectedly");
    }
  }

  return {
    ok: true,
    response: {
      answer: draft.answer,
      answered: draft.answered,
      category: draft.category,
      sourceUrl: draft.used[0]?.sourceUrl ?? null,
      needsReview: draft.needsReview,
      clarification: draft.clarification,
      verification: weakest(draft.used.map((e) => e.verificationLevel)),
      sources: draft.used.map(toSource),
      related,
      logged,
      mode: draft.mode,
    },
  };
}
