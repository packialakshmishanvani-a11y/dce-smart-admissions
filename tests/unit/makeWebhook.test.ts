import { beforeEach, describe, expect, it, vi } from "vitest";
import { logUnansweredQuestion, resetWebhookDedupe, todayInIndia } from "@/lib/integrations/makeWebhook";

const input = { question: "Is there a swimming pool?", category: "General", sourceChecked: "https://dce.edu.in/", chatbotResponse: "I couldn't verify that." };
const URL_ = "https://hook.eu1.make.com/test";

beforeEach(() => resetWebhookDedupe());

describe("Make webhook logging", () => {
  it("posts the agreed JSON payload with today's date", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("Accepted", { status: 200 }));
    const now = new Date("2026-10-25T20:00:00Z"); // already the 26th in India

    const outcome = await logUnansweredQuestion(input, { webhookUrl: URL_, fetchImpl, now });

    expect(outcome).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(URL_);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init!.body as string)).toEqual({
      question: "Is there a swimming pool?",
      category: "General",
      source_checked: "https://dce.edu.in/",
      status: "New",
      date_submitted: "2026-10-26",
      chatbot_response: "I couldn't verify that.",
    });
  });

  it("sends an empty source when none was checked", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok"));
    await logUnansweredQuestion({ ...input, sourceChecked: null }, { webhookUrl: URL_, fetchImpl });
    expect(JSON.parse(fetchImpl.mock.calls[0][1]!.body as string).source_checked).toBe("");
  });

  it("removes phone numbers and emails from the logged question", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok"));
    await logUnansweredQuestion(
      { ...input, question: "Call me on 98765 43210 or mail ravi.k@gmail.com about my Aadhaar 1234 5678 9012" },
      { webhookUrl: URL_, fetchImpl },
    );
    const sent = JSON.parse(fetchImpl.mock.calls[0][1]!.body as string).question;
    expect(sent).not.toMatch(/98765|ravi\.k|1234 5678/);
    expect(sent).toContain("[phone removed]");
  });

  it("skips when not configured", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    expect(await logUnansweredQuestion(input, { webhookUrl: "", fetchImpl })).toEqual({ ok: false, reason: "not_configured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("does not log the same question twice", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok"));
    await logUnansweredQuestion(input, { webhookUrl: URL_, fetchImpl });
    const second = await logUnansweredQuestion({ ...input, question: "  is there a SWIMMING pool " }, { webhookUrl: URL_, fetchImpl });
    expect(second).toEqual({ ok: false, reason: "duplicate" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("reports timeouts without throwing and allows a later retry", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const timeout = Object.assign(new Error("timed out"), { name: "TimeoutError" });
    const failing = vi.fn<typeof fetch>().mockRejectedValue(timeout);
    expect(await logUnansweredQuestion(input, { webhookUrl: URL_, fetchImpl: failing })).toEqual({ ok: false, reason: "timeout" });
    expect(warn.mock.calls.flat().join(" ")).not.toContain(URL_);
    expect(warn.mock.calls.flat().join(" ")).not.toContain("swimming");

    const working = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok"));
    expect(await logUnansweredQuestion(input, { webhookUrl: URL_, fetchImpl: working })).toEqual({ ok: true });
  });

  it("treats non-2xx responses as failures", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("Scenario inactive", { status: 410 }));
    expect(await logUnansweredQuestion(input, { webhookUrl: URL_, fetchImpl })).toEqual({ ok: false, reason: "http_error" });
  });

  it("formats dates as YYYY-MM-DD", () => {
    expect(todayInIndia(new Date("2026-01-05T00:00:00Z"))).toBe("2026-01-05");
  });
});
