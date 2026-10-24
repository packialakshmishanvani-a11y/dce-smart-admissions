import Link from "next/link";
import { Bot, ExternalLink, MessageCircle, Sparkles } from "lucide-react";
import { FAQCategoryCard } from "@/components/faqs/FAQCategoryCard";
import { HeroChatPrompt } from "@/components/chatbot/HeroChatPrompt";
import { VERIFICATION_EXPLAINERS, VerificationBadge } from "@/components/ui/VerificationBadge";
import { button } from "@/components/ui/styles";
import { GROUP_LIST, OFFICIAL_CONTACT } from "@/lib/faq/groups";
import { getFaqRepository } from "@/lib/faq/loadFaqs";

export default function HomePage() {
  const repo = getFaqRepository();
  const preview = repo.byId("FAQ-004");
  const phone = repo.byId("FAQ-035");
  const address = repo.byId("FAQ-037");

  return (
    <>
      {/* Hero with Chatbot Focus */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-900 text-white">
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full border border-cyan-500/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -left-20 top-20 size-[28rem] rounded-full border border-white/5 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-rise">
            {/* Top Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md">
              <span className="flex size-2 rounded-full bg-emerald-400 beacon-ping" />
              <span>DCE Admissions AI Assistant • Capstone 49</span>
            </div>

            <h1 className="font-serif text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              <span className="block">Your Questions.</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-200 to-white">
                Instant Verified Answers.
              </span>
              <span className="block text-2xl font-normal text-white/80 sm:text-3xl lg:text-4xl mt-1">
                Smarter College Admissions.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Get immediate, source-backed answers for DCE Chennai courses, Anna University cutoffs, TNEA counseling, hostel accommodation, and fee queries.
            </p>

            {/* Instant Hero Chat Prompt Bar */}
            <div className="mt-7 max-w-xl">
              <HeroChatPrompt />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-white/70">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-navy-950 shadow-md transition-all hover:bg-cyan-400 hover:shadow-cyan-500/20"
              >
                <MessageCircle className="size-4" />
                Launch Full Chatbot
              </Link>
              <span className="text-white/40">|</span>
              <span className="flex items-center gap-1.5 text-white/80">
                <Sparkles className="size-3.5 text-cyan-300" />
                Powered by Gemini & Verified FAQ Database
              </span>
            </div>
          </div>

          {/* Interactive Chatbot Preview Window */}
          {preview && (
            <div className="animate-rise rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-6 [animation-delay:120ms]">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative grid size-8 place-items-center rounded-xl bg-gradient-to-tr from-cyan-600 to-navy-900 text-white shadow-sm ring-1 ring-white/20">
                    <Bot className="size-4" />
                    <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-navy-900" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">DCE Admissions AI</p>
                    <p className="text-[10px] text-cyan-200/80">Online • Live Assistant</p>
                  </div>
                </div>
                <Link
                  href="/chat"
                  className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/20"
                >
                  Open Chat →
                </Link>
              </div>

              {/* Sample User Bubble */}
              <div className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-cyan-700 to-cyan-600 px-4 py-2.5 text-xs text-white shadow-sm sm:text-sm">
                  {preview.question}
                </p>
              </div>

              {/* Sample Assistant Bubble */}
              <div className="mt-3.5 rounded-2xl rounded-tl-sm border border-white/10 bg-white/95 p-4 text-ink shadow-md">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-navy-900 flex items-center gap-1">
                    <Sparkles className="size-3 text-cyan-600" />
                    Verified Answer
                  </span>
                  <VerificationBadge level={preview.verificationLevel} />
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-800">{preview.answer}</p>
                <div className="mt-2.5 flex items-center gap-2 border-t border-line/60 pt-2 text-[11px] text-muted">
                  <span className="truncate">Source: dce.edu.in/admissions-dce</span>
                </div>
              </div>

              {/* Three dots typing teaser */}
              <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                <span className="flex items-center gap-1" aria-hidden="true">
                  <span className="typing-dot-1 size-1.5 rounded-full bg-cyan-400" />
                  <span className="typing-dot-2 size-1.5 rounded-full bg-cyan-300" />
                  <span className="typing-dot-3 size-1.5 rounded-full bg-white" />
                </span>
                <span className="text-[11px] text-cyan-200/90">
                  Ready to answer your admission questions instantly
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section aria-labelledby="categories-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="max-w-2xl">
          <h2 id="categories-heading" className="text-3xl font-semibold sm:text-4xl">Browse by topic</h2>
          <p className="mt-3 text-muted">Start with the questions other students and parents ask most, grouped the way admissions works.</p>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GROUP_LIST.map((info) => (
            <li key={info.slug}>
              <FAQCategoryCard info={info} count={repo.byGroup(info.group).length} />
            </li>
          ))}
        </ul>
      </section>

      {/* About / trust */}
      <section id="about" aria-labelledby="about-heading" className="border-y border-line bg-navy-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 id="about-heading" className="text-3xl font-semibold sm:text-4xl">How answers are checked</h2>
            <p className="mt-4 leading-relaxed text-muted">
              The assistant answers only from a reviewed list of admission FAQs drawn from the official DCE and TNEA websites. It
              doesn’t browse the web live and it won’t guess dates, fees, or cutoffs. When it can’t confirm something, it says so
              and points you to the admissions office. Questions it can’t answer are collected for the admissions team, so the FAQ keeps improving.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {VERIFICATION_EXPLAINERS.map(({ level, text }) => (
              <li key={level} className="rounded-2xl border border-line bg-white p-5">
                <VerificationBadge level={level} />
                <p className="mt-3 text-sm leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" aria-labelledby="contact-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 id="contact-heading" className="text-3xl font-semibold sm:text-4xl">Talk to the admissions office</h2>
            <p className="mt-4 text-muted">For fees, current dates, or anything specific to your case, the college is the final word.</p>
            <a href={OFFICIAL_CONTACT} target="_blank" rel="noopener noreferrer" className={`${button.navy} mt-6`}>
              Open the official contact page
              <ExternalLink aria-hidden className="size-4" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              { term: "Phone", entry: phone },
              { term: "Address", entry: address },
            ].map(({ term, entry }) =>
              entry ? (
                <div key={term} className="rounded-2xl border border-line p-5 shadow-card">
                  <dt className="flex items-center justify-between gap-2 font-semibold text-navy-900">
                    {term}
                    <VerificationBadge level={entry.verificationLevel} title={entry.verificationStatus} />
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted">{entry.answer}</dd>
                </div>
              ) : null,
            )}
          </dl>
        </div>
      </section>
    </>
  );
}
