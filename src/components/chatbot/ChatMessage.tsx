"use client";

import { useState } from "react";
import { Bot, Check, Copy, ExternalLink, Inbox, RotateCcw, Sparkles, TriangleAlert, User } from "lucide-react";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { button } from "@/components/ui/styles";
import { OFFICIAL_CONTACT } from "@/lib/faq/groups";
import { linkify } from "@/lib/linkify";
import { SuggestedQuestions } from "./SuggestedQuestions";
import type { UiMessage } from "./types";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-navy-50 hover:text-navy-900"
      aria-label={copied ? "Answer copied" : "Copy answer"}
    >
      {copied ? <Check aria-hidden className="size-3.5 text-ok" /> : <Copy aria-hidden className="size-3.5" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function prettyUrl(url: string) {
  try {
    const u = new URL(url);
    return u.host + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}

export function ChatMessage({
  message,
  onRetry,
  onAsk,
  busy,
}: {
  message: UiMessage;
  onRetry: (question: string) => void;
  onAsk: (question: string) => void;
  busy: boolean;
}) {
  if (message.role === "user") {
    return (
      <li className="flex justify-end gap-2.5 sm:gap-3 animate-rise">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 px-4 py-3 text-white shadow-md sm:max-w-[78%]">
          <span className="sr-only">You said: </span>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed sm:text-[15px]">{message.content}</p>
        </div>
        <div
          aria-hidden="true"
          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-navy-800 text-white shadow-sm ring-1 ring-white/10"
        >
          <User className="size-4 text-cyan-300" />
        </div>
      </li>
    );
  }

  if (message.kind === "error") {
    return (
      <li className="flex gap-2.5 sm:gap-3 animate-rise">
        <div
          aria-hidden="true"
          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-risk-wash text-risk ring-1 ring-risk/30"
        >
          <TriangleAlert className="size-4" />
        </div>
        <div role="alert" className="max-w-[90%] rounded-2xl rounded-tl-sm border border-risk/30 bg-risk-wash px-4 py-3 sm:max-w-[80%]">
          <p className="flex items-start gap-2 text-sm text-risk font-medium">
            {message.content}
          </p>
          {message.retryable && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onRetry(message.question)}
              className={`${button.outline} mt-2.5 min-h-8 px-3 py-1 text-xs`}
            >
              <RotateCcw aria-hidden className="size-3.5" />
              Try again
            </button>
          )}
        </div>
      </li>
    );
  }

  const response = message.kind === "answer" ? message.response : null;

  return (
    <li className="flex gap-2.5 sm:gap-3 animate-rise">
      {/* Assistant Avatar */}
      <div
        aria-hidden="true"
        className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-tr from-cyan-700 via-cyan-600 to-navy-900 text-white shadow-md ring-2 ring-cyan-100"
      >
        <Bot className="size-4 text-white" />
      </div>

      <article
        aria-label="Assistant reply"
        className="w-full max-w-[92%] rounded-2xl rounded-tl-sm border border-line/90 bg-white p-4 shadow-card sm:max-w-[82%]"
      >
        {/* Top meta row */}
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-navy-900">
              <Sparkles className="size-3 text-cyan-600" />
              DCE Admissions AI
            </span>
            {response?.category && (
              <span className="rounded-md bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-700">
                {response.category}
              </span>
            )}
          </div>
          {response?.verification && <VerificationBadge level={response.verification} />}
        </div>

        {/* Message body */}
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink sm:text-[15px]">
          {linkify(message.content)}
        </div>

        {response && (
          <>
            {/* Citations / Sources */}
            {response.sources.length > 0 && (
              <div className="mt-3.5 rounded-xl border border-line/70 bg-navy-50/70 p-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Verified References</p>
                <ul className="space-y-1.5 text-xs">
                  {response.sources.flatMap((s) =>
                    (s.urls.length > 0 ? s.urls : [null]).map((url) => (
                      <li key={`${s.faqId}-${url}`} className="flex flex-wrap items-center gap-1.5 text-muted">
                        <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-medium text-navy-800 border border-line">
                          {s.faqId}
                        </span>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-cyan-ink hover:underline"
                          >
                            <span>{prettyUrl(url)}</span>
                            <ExternalLink aria-hidden className="size-3" />
                            <span className="sr-only">(opens in a new tab)</span>
                          </a>
                        ) : (
                          <span>Official DCE Admissions Dataset</span>
                        )}
                        {s.verificationStatus && (
                          <span className="text-[11px] text-muted italic">({s.verificationStatus})</span>
                        )}
                      </li>
                    )),
                  )}
                </ul>
              </div>
            )}

            {/* Need confirmation notification */}
            {response.needsReview && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-cyan-200/60 bg-cyan-wash/50 p-2.5 text-xs text-navy-900">
                <Inbox aria-hidden className="mt-0.5 size-4 shrink-0 text-cyan-ink" />
                <div>
                  {response.logged ? (
                    <span>Your question has been noted for the admissions desk to update our verified answers.</span>
                  ) : (
                    <span>
                      For official confirmation on this query, please{" "}
                      <a href={OFFICIAL_CONTACT} target="_blank" rel="noopener noreferrer" className="font-semibold text-cyan-ink underline">
                        contact the admissions office directly
                      </a>
                      .
                    </span>
                  )}
                </div>
              </div>
            )}

            {response.mode === "faq-direct" && (
              <p className="mt-2 text-[11px] text-muted">
                Direct answer from verified FAQ database.
              </p>
            )}

            {/* Related Questions */}
            {response.related.length > 0 && (
              <div className="mt-3.5 border-t border-line/60 pt-3">
                <SuggestedQuestions
                  label="You might also want to ask:"
                  questions={response.related.map((r) => r.question)}
                  onPick={onAsk}
                  disabled={busy}
                />
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-2.5 flex items-center justify-between border-t border-line/40 pt-1.5">
              <CopyButton text={message.content} />
              <span className="text-[11px] text-muted">DCE Capstone 49</span>
            </div>
          </>
        )}
      </article>
    </li>
  );
}
