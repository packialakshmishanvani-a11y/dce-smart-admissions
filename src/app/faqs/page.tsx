import type { Metadata } from "next";
import { FAQBrowser } from "@/components/faqs/FAQBrowser";
import { groupFromSlug } from "@/lib/faq/groups";
import { getFaqRepository } from "@/lib/faq/loadFaqs";

export const metadata: Metadata = { title: "Admissions FAQs" };

export default async function FaqsPage({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const { category } = await searchParams;
  const initialGroup = groupFromSlug(Array.isArray(category) ? category[0] : category);
  const faqs = getFaqRepository().all();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
      <h1 className="text-4xl font-semibold sm:text-5xl">Admissions FAQs</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Each answer shows its source and how far it’s been verified. Dates and fees change every cycle — confirm them with the
        college before you act.
      </p>
      <div className="mt-10">
        <FAQBrowser faqs={faqs} initialGroup={initialGroup} />
      </div>
    </div>
  );
}
