import { describe, expect, it, vi } from "vitest";
import { GeminiError, generateGeminiReply } from "@/lib/ai/gemini";

const KEY = "test-key-not-real";
const contents = [{ role: "user" as const, parts: [{ text: "hi" }] }];

function geminiResponse(text: string, status = 200) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status });
}

describe("Gemini client", () => {
  it("parses a structured reply and sends the key only in a header", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      geminiResponse(JSON.stringify({ status: "answered", answer: "Yes.", usedFaqIds: ["FAQ-010"], category: "Admissions" })),
    );
    const reply = await generateGeminiReply(contents, { apiKey: KEY, fetchImpl });
    expect(reply).toEqual({ status: "answered", answer: "Yes.", usedFaqIds: ["FAQ-010"], category: "Admissions" });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).not.toContain(KEY);
    expect((init!.headers as Record<string, string>)["x-goog-api-key"]).toBe(KEY);
    const body = JSON.parse(init!.body as string);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.systemInstruction.parts[0].text).toContain("DCE Admissions Assistant");
  });

  it("coerces an unknown category to General", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      geminiResponse(JSON.stringify({ status: "clarify", answer: "Which one?", usedFaqIds: [], category: "Sports" })),
    );
    expect((await generateGeminiReply(contents, { apiKey: KEY, fetchImpl })).category).toBe("General");
  });

  it.each([
    ["no key", { apiKey: "" }, "not_configured"],
    ["quota", { fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 429 })) }, "quota"],
    ["server error", { fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 500 })) }, "upstream"],
    ["timeout", { fetchImpl: vi.fn<typeof fetch>().mockRejectedValue(Object.assign(new Error("t"), { name: "TimeoutError" })) }, "timeout"],
    ["blocked/empty", { fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ candidates: [] }))) }, "invalid_response"],
    ["malformed JSON text", { fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(geminiResponse("not json")) }, "invalid_response"],
    ["wrong shape", { fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(geminiResponse('{"status":"maybe"}')) }, "invalid_response"],
  ])("maps %s to a typed error without leaking the key", async (_label, opts, kind) => {
    const err = await generateGeminiReply(contents, { apiKey: KEY, ...opts }).catch((e) => e);
    expect(err).toBeInstanceOf(GeminiError);
    expect(err.kind).toBe(kind);
    expect(err.message).not.toContain(KEY);
  });
});
