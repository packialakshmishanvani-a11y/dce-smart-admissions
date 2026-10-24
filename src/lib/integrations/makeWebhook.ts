import "server-only";
import { redactPersonalData } from "@/lib/security/redact";

/** Body sent to the Make "Custom Webhook" module, mapped to Notion properties there. */
export interface UnansweredQuestionPayload {
  question: string;
  category: string;
  source_checked: string;
  status: "New";
  date_submitted: string; // YYYY-MM-DD
  chatbot_response: string;
}

export type LogOutcome =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "duplicate" | "timeout" | "http_error" | "network_error" };

export interface LogOptions {
  webhookUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  now?: Date;
}

/** Notion rich-text properties cap each text block at 2,000 characters. */
const NOTION_TEXT_LIMIT = 2000;
const DEDUPE_TTL_MS = 24 * 60 * 60 * 1000;
const recent = new Map<string, number>();

/** Local calendar date (YYYY-MM-DD) in India time, where the admissions office works. */
export function todayInIndia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function dedupeKey(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Test helper. */
export function resetWebhookDedupe() {
  recent.clear();
}

/**
 * Logs a question that needs human review. Never throws: the chat answer
 * must reach the student whether or not logging works. Repeat submissions
 * of the same question within 24 hours (per server process) are skipped.
 */
export async function logUnansweredQuestion(
  input: { question: string; category: string; sourceChecked: string | null; chatbotResponse: string },
  options: LogOptions = {},
): Promise<LogOutcome> {
  const webhookUrl = (options.webhookUrl ?? process.env.MAKE_WEBHOOK_URL ?? "").trim();
  if (!webhookUrl) return { ok: false, reason: "not_configured" };

  const now = options.now ?? new Date();
  const key = dedupeKey(input.question);
  const seenAt = recent.get(key);
  if (seenAt !== undefined && now.getTime() - seenAt < DEDUPE_TTL_MS) return { ok: false, reason: "duplicate" };
  // Reserve the key before sending so concurrent retries don't double-log.
  recent.set(key, now.getTime());
  if (recent.size > 2000) {
    for (const [k, t] of recent) if (now.getTime() - t >= DEDUPE_TTL_MS) recent.delete(k);
  }

  const payload: UnansweredQuestionPayload = {
    question: redactPersonalData(input.question).slice(0, NOTION_TEXT_LIMIT),
    category: input.category,
    source_checked: input.sourceChecked ?? "",
    status: "New",
    date_submitted: todayInIndia(now),
    chatbot_response: input.chatbotResponse.slice(0, NOTION_TEXT_LIMIT),
  };

  const doFetch = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? Number(process.env.MAKE_WEBHOOK_TIMEOUT_MS ?? 4000);

  try {
    const res = await doFetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) {
      recent.delete(key); // allow a later retry
      console.warn(`[make-webhook] logging failed: HTTP ${res.status}`);
      return { ok: false, reason: "http_error" };
    }
    return { ok: true };
  } catch (err) {
    recent.delete(key);
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    // Never log the webhook URL or the student's question.
    console.warn(`[make-webhook] logging failed: ${timedOut ? "timeout" : "network error"}`);
    return { ok: false, reason: timedOut ? "timeout" : "network_error" };
  }
}
