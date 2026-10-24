import "server-only";
import { z } from "zod";
import { FAQ_GROUPS } from "@/types/faq";
import { RESPONSE_SCHEMA, SYSTEM_INSTRUCTIONS, type GeminiContent } from "./prompts";

export type GeminiErrorKind = "not_configured" | "quota" | "timeout" | "upstream" | "invalid_response";

export class GeminiError extends Error {
  constructor(public readonly kind: GeminiErrorKind, message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

export const geminiReplySchema = z.object({
  status: z.enum(["answered", "clarify", "cannot_verify", "out_of_scope"]),
  answer: z.string(),
  usedFaqIds: z.array(z.string()).default([]),
  category: z.enum([...FAQ_GROUPS, "General"]).catch("General"),
});

export type GeminiReply = z.infer<typeof geminiReplySchema>;

export interface GeminiOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * Calls the Gemini generateContent REST endpoint with structured JSON output.
 * Uses fetch directly (no SDK) so the request is easy to time out and mock.
 * Error messages never include the key, the request body, or the raw response.
 */
export async function generateGeminiReply(contents: GeminiContent[], options: GeminiOptions = {}): Promise<GeminiReply> {
  const apiKey = (options.apiKey ?? process.env.GEMINI_API_KEY ?? "").trim();
  if (!apiKey) throw new GeminiError("not_configured", "Gemini API key is not configured");

  const model = options.model ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const timeoutMs = options.timeoutMs ?? Number(process.env.GEMINI_TIMEOUT_MS ?? 12_000);
  const doFetch = options.fetchImpl ?? fetch;

  let res: Response;
  try {
    res = await doFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTIONS }] },
          contents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      },
    );
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "TimeoutError" || name === "AbortError") throw new GeminiError("timeout", "Gemini request timed out");
    throw new GeminiError("upstream", "Gemini request failed");
  }

  if (res.status === 429) throw new GeminiError("quota", "Gemini quota or rate limit reached");
  if (!res.ok) throw new GeminiError("upstream", `Gemini returned HTTP ${res.status}`);

  let text: string | undefined;
  try {
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    };
    text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
  } catch {
    throw new GeminiError("invalid_response", "Gemini response was not JSON");
  }
  if (!text) throw new GeminiError("invalid_response", "Gemini returned no content (possibly blocked)");

  try {
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    return geminiReplySchema.parse(JSON.parse(cleaned));
  } catch {
    throw new GeminiError("invalid_response", "Gemini reply did not match the expected shape");
  }
}
