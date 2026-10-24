"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ChevronDown, ExternalLink, MessageCircle } from "lucide-react";
import type { FaqEntry } from "@/types/faq";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { linkify } from "@/lib/linkify";

function AccordionItem({ entry, defaultOpen }: { entry: FaqEntry; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <li className="rounded-2xl border border-line bg-white">
      <h3 className="font-sans text-base">
        <button
          type="button"
          id={`${id}-trigger`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-start gap-3 rounded-2xl px-5 py-4 text-left font-semibold text-navy-900 hover:bg-navy-50"
        >
          <span className="flex-1">{entry.question}</span>
          <ChevronDown aria-hidden className={`mt-0.5 size-5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </h3>
      <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-trigger`} hidden={!open} className="px-5 pb-5">
        <p className="max-w-prose leading-relaxed text-ink">{linkify(entry.answer)}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <VerificationBadge level={entry.verificationLevel} />
          <span className="text-muted">{entry.verificationStatus}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {entry.sourceUrls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-cyan-ink underline-offset-2 hover:underline">
              {new URL(url).host}
              {new URL(url).pathname !== "/" ? new URL(url).pathname : ""}
              <ExternalLink aria-hidden className="size-3.5" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ))}
          <Link href={`/chat?q=${encodeURIComponent(entry.question)}`} className="inline-flex items-center gap-1 font-medium text-navy-800 hover:underline">
            <MessageCircle aria-hidden className="size-3.5" />
            Ask a follow-up
          </Link>
        </div>
      </div>
    </li>
  );
}

export function FAQAccordion({ entries, openFirst = false }: { entries: FaqEntry[]; openFirst?: boolean }) {
  return (
    <ul className="space-y-3">
      {entries.map((entry, i) => (
        <AccordionItem key={entry.id} entry={entry} defaultOpen={openFirst && i === 0} />
      ))}
    </ul>
  );
}
