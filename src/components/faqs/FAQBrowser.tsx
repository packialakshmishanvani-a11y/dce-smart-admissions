"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { FaqEntry, FaqGroup } from "@/types/faq";
import { GROUP_LIST } from "@/lib/faq/groups";
import { retrieveFaqs } from "@/lib/faq/retrieveFaqs";
import { button } from "@/components/ui/styles";
import { FAQAccordion } from "./FAQAccordion";

export function FAQBrowser({ faqs, initialGroup }: { faqs: FaqEntry[]; initialGroup: FaqGroup | null }) {
  const [group, setGroup] = useState<FaqGroup | null>(initialGroup);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const scoped = group ? faqs.filter((f) => f.group === group) : faqs;
    if (!query.trim()) return scoped;
    return retrieveFaqs(query, scoped, { limit: 20, minScore: 0.2 }).map((r) => r.entry);
  }, [faqs, group, query]);

  const selectGroup = (next: FaqGroup | null) => {
    setGroup(next);
    const slug = GROUP_LIST.find((g) => g.group === next)?.slug;
    // Keep the URL shareable without a navigation.
    window.history.replaceState(null, "", slug ? `/faqs?category=${slug}` : "/faqs");
  };

  const chip = "min-h-10 rounded-full border px-4 text-sm font-medium transition-colors";
  const on = "border-navy-900 bg-navy-900 text-white";
  const off = "border-line bg-white text-navy-900 hover:border-navy-700";

  return (
    <div>
      <label htmlFor="faq-search" className="text-sm font-semibold text-navy-900">
        Search the FAQs
      </label>
      <div className="relative mt-2">
        <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input
          id="faq-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “hostel”, “lateral entry”, or “TNEA code”"
          className="min-h-12 w-full rounded-xl border border-line bg-white pl-12 pr-4 text-base placeholder:text-muted/80 focus:border-navy-700"
        />
      </div>

      <div role="group" aria-label="Filter by topic" className="mt-5 flex flex-wrap gap-2">
        <button type="button" aria-pressed={group === null} onClick={() => selectGroup(null)} className={`${chip} ${group === null ? on : off}`}>
          All topics
        </button>
        {GROUP_LIST.map((g) => (
          <button key={g.slug} type="button" aria-pressed={group === g.group} onClick={() => selectGroup(g.group)} className={`${chip} ${group === g.group ? on : off}`}>
            {g.group}
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {visible.length} {visible.length === 1 ? "question" : "questions"}
        {group ? ` in ${group}` : ""}
        {query.trim() ? ` matching “${query.trim()}”` : ""}
      </p>

      <div className="mt-3">
        {visible.length > 0 ? (
          <FAQAccordion key={`${group}-${query}`} entries={visible} openFirst={!!query.trim()} />
        ) : (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center">
            <p className="font-semibold text-navy-900">No FAQ matches that yet.</p>
            <p className="mt-1 text-sm text-muted">Ask the assistant — if it can’t confirm an answer, your question goes to the admissions team for review.</p>
            <Link href={`/chat${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`} className={`${button.primary} mt-4`}>
              Ask the assistant
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
