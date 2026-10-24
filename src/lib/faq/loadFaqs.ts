import rawFaqs from "@data/faqs.json";
import type { FaqEntry, FaqGroup } from "@/types/faq";
import { faqDatasetSchema } from "./normalize";

/**
 * Data-access boundary for FAQs. Everything else in the app goes through
 * this interface, so the JSON file can later be swapped for a database or
 * a vector store without touching the chat route or UI.
 */
export interface FaqRepository {
  all(): FaqEntry[];
  byId(id: string): FaqEntry | undefined;
  byGroup(group: FaqGroup): FaqEntry[];
}

export function createFaqRepository(entries: FaqEntry[]): FaqRepository {
  const index = new Map(entries.map((e) => [e.id, e]));
  return {
    all: () => entries,
    byId: (id) => index.get(id),
    byGroup: (group) => entries.filter((e) => e.group === group),
  };
}

let cached: FaqRepository | null = null;

/** Loads and validates data/faqs.json once per server process. */
export function getFaqRepository(): FaqRepository {
  if (!cached) {
    const parsed = faqDatasetSchema.safeParse(rawFaqs);
    if (!parsed.success) {
      console.error("[faq] data/faqs.json failed validation; serving an empty dataset");
      cached = createFaqRepository([]);
    } else {
      cached = createFaqRepository(parsed.data);
    }
  }
  return cached;
}
