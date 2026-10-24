import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/chat/answerQuestion";
import { getFaqRepository } from "@/lib/faq/loadFaqs";
import { generateGeminiReply } from "@/lib/ai/gemini";
import { logUnansweredQuestion } from "@/lib/integrations/makeWebhook";
import { clientKey, createRateLimiter } from "@/lib/security/rateLimit";
import { MAX_BODY_BYTES, chatRequestSchema } from "@/lib/validation/chatSchema";
import type { ChatErrorResponse, ChatResponse } from "@/types/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = createRateLimiter({
  limit: Number(process.env.CHAT_RATE_LIMIT_PER_MINUTE ?? 12),
  windowMs: 60_000,
});

const NO_STORE = { "Cache-Control": "no-store" };

function error(status: number, message: string, retryable: boolean, headers: Record<string, string> = {}) {
  return NextResponse.json<ChatErrorResponse>({ error: message, retryable }, { status, headers: { ...NO_STORE, ...headers } });
}

export async function POST(request: Request) {
  const rate = limiter.check(clientKey(request.headers));
  if (!rate.allowed) {
    return error(429, "You’re sending questions quickly. Please wait a moment and try again.", true, {
      "Retry-After": String(rate.retryAfterSeconds),
    });
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return error(413, "That request is too large.", false);
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return error(413, "That request is too large.", false);
    body = JSON.parse(raw);
  } catch {
    return error(400, "The request could not be read. Please try again.", false);
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return error(400, parsed.error.issues[0]?.message ?? "Invalid request.", false);
  }

  try {
    const result = await answerQuestion(parsed.data.message, parsed.data.history, {
      faqs: getFaqRepository().all(),
      generate: (contents) => generateGeminiReply(contents),
      log: (input) => logUnansweredQuestion(input),
    });

    if (!result.ok) return error(result.status, result.error, result.retryable);
    return NextResponse.json<ChatResponse>(result.response, { headers: NO_STORE });
  } catch {
    console.error("[chat] unexpected error while answering");
    return error(500, "Something went wrong on our side. Please try again.", true);
  }
}

export function GET() {
  return error(405, "Use POST to send a question.", false, { Allow: "POST" });
}
