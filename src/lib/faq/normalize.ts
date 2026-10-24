import { z } from "zod";
import { FAQ_GROUPS, type FaqEntry, type FaqGroup, type VerificationLevel } from "@/types/faq";

/** Maps the CSV's own categories onto the eight student-facing groups. */
const CATEGORY_TO_GROUP: Record<string, FaqGroup> = {
  admissions: "Admissions",
  deadlines: "Admissions",
  courses: "Courses",
  intake: "Courses",
  eligibility: "Eligibility",
  fees: "Fees",
  scholarships: "Scholarships",
  documents: "Documents",
  hostel: "Campus Facilities",
  transport: "Campus Facilities",
  placements: "Campus Facilities",
  facilities: "Campus Facilities",
  "campus facilities": "Campus Facilities",
  contact: "Contact & Support",
  "contact & support": "Contact & Support",
  "human escalation": "Contact & Support",
};

/**
 * Entries filed under "Admissions" in the CSV that students will look for
 * under Contact & Support. A "Group" column in the CSV overrides both maps.
 */
const GROUP_OVERRIDES: Record<string, FaqGroup> = {
  "FAQ-035": "Contact & Support",
  "FAQ-036": "Contact & Support",
  "FAQ-037": "Contact & Support",
};

/**
 * Turns the free-text "Verification Status" column into a trust level.
 * Anything not clearly verified is treated as unverified — never the reverse.
 */
export function toVerificationLevel(status: string): VerificationLevel {
  const s = status.trim().toLowerCase();
  if (!s) return "unverified";
  if (s.startsWith("partially verified") || s.startsWith("partly verified")) return "partial";
  if (s.startsWith("verified") || s.startsWith("official external source")) return "verified";
  if (s.startsWith("policy") || s.startsWith("project rule")) return "policy";
  return "unverified";
}

export function toGroup(id: string, category: string, explicitGroup?: string): FaqGroup | null {
  if (explicitGroup) {
    const match = FAQ_GROUPS.find((g) => g.toLowerCase() === explicitGroup.trim().toLowerCase());
    if (match) return match;
  }
  return GROUP_OVERRIDES[id] ?? CATEGORY_TO_GROUP[category.trim().toLowerCase()] ?? null;
}

export function parseSourceUrls(cell: string): string[] {
  return cell
    .split(/[;\s]+/)
    .map((u) => u.trim())
    .filter((u) => {
      try {
        const url = new URL(u);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    });
}

/** Column aliases, compared case-insensitively with spaces/underscores removed. */
const COLUMN_ALIASES = {
  id: ["faqid", "id"],
  category: ["category"],
  group: ["group"],
  question: ["question"],
  answer: ["answer"],
  sourceUrl: ["sourceurl", "source", "sourceurls"],
  verificationStatus: ["verificationstatus", "status"],
  lastVerifiedAt: ["lastverifiedat", "lastverified", "verifiedon"],
} as const;

function pick(record: Record<string, string>, aliases: readonly string[]): string {
  for (const [key, value] of Object.entries(record)) {
    if ((aliases as readonly string[]).includes(key.toLowerCase().replace(/[\s_-]/g, ""))) return value;
  }
  return "";
}

export interface NormalizeResult {
  entries: FaqEntry[];
  warnings: string[];
}

export function normalizeFaqRecords(records: Record<string, string>[]): NormalizeResult {
  const entries: FaqEntry[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  records.forEach((record, index) => {
    const row = index + 2; // header is row 1
    const id = pick(record, COLUMN_ALIASES.id);
    const category = pick(record, COLUMN_ALIASES.category);
    const question = pick(record, COLUMN_ALIASES.question);
    const answer = pick(record, COLUMN_ALIASES.answer);

    if (!id || !question || !answer) {
      warnings.push(`Row ${row}: skipped (missing FAQ ID, question, or answer)`);
      return;
    }
    if (seen.has(id)) {
      warnings.push(`Row ${row}: skipped duplicate FAQ ID ${id}`);
      return;
    }

    const group = toGroup(id, category, pick(record, COLUMN_ALIASES.group));
    if (!group) {
      warnings.push(`Row ${row}: unknown category "${category}" for ${id}; filed under Contact & Support`);
    }

    const verificationStatus = pick(record, COLUMN_ALIASES.verificationStatus);
    const sourceUrls = parseSourceUrls(pick(record, COLUMN_ALIASES.sourceUrl));
    const lastVerifiedAt = pick(record, COLUMN_ALIASES.lastVerifiedAt);

    seen.add(id);
    entries.push({
      id,
      category: category || "Uncategorized",
      group: group ?? "Contact & Support",
      question,
      answer,
      sourceUrl: sourceUrls[0] ?? null,
      sourceUrls,
      verificationStatus: verificationStatus || "Not stated",
      verificationLevel: toVerificationLevel(verificationStatus),
      ...(lastVerifiedAt ? { lastVerifiedAt } : {}),
    });
  });

  return { entries, warnings };
}

/** Runtime schema for data/faqs.json, so a hand-edited file can't break the bot silently. */
export const faqEntrySchema = z.object({
  id: z.string().min(1),
  category: z.string(),
  group: z.enum(FAQ_GROUPS),
  question: z.string().min(1),
  answer: z.string().min(1),
  sourceUrl: z.url().nullable(),
  sourceUrls: z.array(z.url()),
  verificationStatus: z.string(),
  verificationLevel: z.enum(["verified", "partial", "unverified", "policy"]),
  lastVerifiedAt: z.string().optional(),
});

export const faqDatasetSchema = z.array(faqEntrySchema);
