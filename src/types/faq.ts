/** The eight student-facing groups shown as cards on the site. */
export const FAQ_GROUPS = [
  "Admissions",
  "Courses",
  "Eligibility",
  "Fees",
  "Scholarships",
  "Documents",
  "Campus Facilities",
  "Contact & Support",
] as const;

export type FaqGroup = (typeof FAQ_GROUPS)[number];

/**
 * How far an FAQ answer can be trusted.
 * - verified: checked against an official source
 * - partial: partly checked; answer must carry a "confirm" caveat
 * - unverified: needs human/current-year verification; never presented as fact
 * - policy: a chatbot rule (e.g. "we can't guarantee admission"), not a college fact
 */
export type VerificationLevel = "verified" | "partial" | "unverified" | "policy";

export interface FaqEntry {
  id: string;
  /** Category exactly as written in the source CSV (e.g. "Hostel", "Deadlines"). */
  category: string;
  /** Student-facing group used for cards and Notion logging. */
  group: FaqGroup;
  question: string;
  answer: string;
  /** Primary source link (first URL in the CSV cell). */
  sourceUrl: string | null;
  /** Every source link listed in the CSV cell. */
  sourceUrls: string[];
  /** Raw status text from the CSV, kept for reviewers. */
  verificationStatus: string;
  verificationLevel: VerificationLevel;
  lastVerifiedAt?: string;
}
