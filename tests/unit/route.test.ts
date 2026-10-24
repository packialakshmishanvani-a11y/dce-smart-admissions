import { beforeEach, describe, expect, it, vi } from "vitest";

const generate = vi.fn();
const log = vi.fn();

vi.mock("@/lib/ai/gemini", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai/gemini")>()),
  generateGeminiReply: (...args: unknown[]) => generate(...args),
}));
vi.mock("@/lib/integrations/makeWebhook", () => ({
  logUnansweredQuestion: (...args: unknown[]) => log(...args),
}));

const { POST, GET } = await import("@/app/api/chat/route");

let ip = 0;
function post(body: unknown, raw = false) {
  return POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${++ip}` },
      body: raw ? (body as string) : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  generate.mockReset();
  log.mockReset().mockResolvedValue({ ok: true });
});

describe("POST /api/chat", () => {
  it("returns the documented JSON shape", async () => {
    generate.mockResolvedValue({ status: "answered", answer: "TNEA code 1405.", usedFaqIds: ["FAQ-005"], category: "Admissions" });
    const res = await post({ message: "What is DCE's TNEA code?", history: [] });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const json = await res.json();
    expect(json).toMatchObject({
      answer: "TNEA code 1405.",
      answered: true,
      category: "Admissions",
      sourceUrl: "https://dce.edu.in/admissions-dce/",
      needsReview: false,
    });
  });

  it("defaults history to an empty list", async () => {
    generate.mockResolvedValue({ status: "out_of_scope", answer: "", usedFaqIds: [], category: "General" });
    expect((await post({ message: "hello" })).status).toBe(200);
  });

  it.each([
    ["missing message", {}],
    ["empty message", { message: "   " }],
    ["non-string message", { message: 42 }],
    ["overlong message", { message: "a".repeat(501) }],
    ["bad history role", { message: "hi", history: [{ role: "system", content: "x" }] }],
    ["too much history", { message: "hi", history: Array.from({ length: 21 }, () => ({ role: "user", content: "x" })) }],
  ])("rejects %s with 400", async (_label, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.retryable).toBe(false);
    expect(typeof json.error).toBe("string");
    expect(generate).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON", async () => {
    expect((await post("{not json", true)).status).toBe(400);
  });

  it("returns 503 with a retry hint when Gemini is temporarily down", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { GeminiError } = await import("@/lib/ai/gemini");
    generate.mockRejectedValue(new GeminiError("upstream", "x"));
    const res = await post({ message: "Tell me about the bus routes near Tambaram station" });
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ retryable: true });
  });

  it("rate-limits a single client", async () => {
    generate.mockResolvedValue({ status: "out_of_scope", answer: "", usedFaqIds: [], category: "General" });
    const send = () =>
      POST(new Request("http://localhost/api/chat", { method: "POST", headers: { "x-forwarded-for": "203.0.113.9" }, body: JSON.stringify({ message: "hi" }) }));
    const statuses = [];
    for (let i = 0; i < 13; i++) statuses.push((await send()).status);
    expect(statuses.slice(0, 12).every((s) => s === 200)).toBe(true);
    expect(statuses[12]).toBe(429);
  });

  it("answers GET with 405", async () => {
    expect(GET().status).toBe(405);
  });
});
