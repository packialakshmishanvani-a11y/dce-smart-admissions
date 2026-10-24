import type { FaqEntry } from "@/types/faq";

/**
 * Lightweight lexical retrieval (IDF-weighted term overlap with synonyms).
 * Good enough for a 40-entry dataset and fully deterministic; replace this
 * module with embeddings/RAG later without changing its return shape.
 */

const STOPWORDS = new Set(
  (
    "a an the and or of to in on for at by with from is are was were be been being am do does did " +
    "i me my we our you your it its this that these those there here what which who whom whose when " +
    "where why how can could would should will shall may might must have has had any some about into " +
    "tell please know want need get give show list kindly dce dhanalakshmi college engineering office detail details information info " +
    "chennai if so as than then also just only all not no yes hi hello hey thanks thank us there's " +
    "what's whats it's im i'm"
  ).split(/\s+/),
);

/** Canonical forms: every variant on the left is indexed as the term on the right. */
const SYNONYM_GROUPS: Record<string, string[]> = {
  programme: ["programme", "programmes", "program", "programs", "course", "courses", "branch", "branches", "degree", "degrees", "department", "departments", "stream", "streams", "offer", "offered", "offers", "specialisation", "specialization"],
  undergraduate: ["undergraduate", "ug", "be", "btech", "b.e", "b.tech", "bachelor", "bachelors"],
  postgraduate: ["postgraduate", "pg", "mtech", "m.e", "m.tech", "master", "masters"],
  fee: ["fee", "fees", "cost", "costs", "tuition", "price", "charge", "charges", "payment", "pay", "expense", "expenses"],
  hostel: ["hostel", "hostels", "accommodation", "dorm", "dormitory", "stay", "room", "rooms", "residence"],
  transport: ["transport", "transportation", "bus", "buses", "commute", "travel", "van"],
  scholarship: ["scholarship", "scholarships", "concession", "freeship", "aid", "stipend", "financial"],
  document: ["document", "documents", "certificate", "certificates", "papers", "proof", "proofs", "checklist", "marksheet"],
  eligibility: ["eligibility", "eligible", "qualify", "qualification", "criteria", "requirement", "requirements", "minimum", "cutoff", "cut-off"],
  apply: ["apply", "application", "applications", "applying", "register", "registration", "enrol", "enroll", "enrolment", "enrollment"],
  admission: ["admission", "admissions", "admit", "admitted", "join", "joining", "entry"],
  deadline: ["deadline", "deadlines", "last", "date", "dates", "due", "begin", "begins", "start", "starts", "schedule"],
  contact: ["contact", "phone", "call", "number", "numbers", "mobile", "reach", "helpline", "enquiry", "inquiry"],
  email: ["email", "e-mail", "mail", "mailid"],
  location: ["location", "located", "address", "situated", "directions"],
  placement: ["placement", "placements", "placed", "package", "salary", "ctc", "recruit", "recruiter", "recruiters", "companies", "company", "job", "jobs"],
  lateral: ["lateral", "diploma", "polytechnic"],
  sports: ["sports", "sport", "athlete", "athletics"],
  management: ["management", "nri"],
  tnea: ["tnea", "counselling", "counseling"],
  marks: ["marks", "mark", "percentage", "percent", "score", "aggregate"],
  intake: ["intake", "seat", "seats", "capacity", "sanctioned"],
  guarantee: ["guarantee", "guaranteed", "assure", "sure", "promise"],
};

const SYNONYMS = new Map<string, string>();
for (const [canonical, variants] of Object.entries(SYNONYM_GROUPS)) {
  for (const v of variants) SYNONYMS.set(v, canonical);
}

function stem(word: string): string {
  if (word.length <= 4) return word;
  for (const suffix of ["ing", "ed", "es", "s"]) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) return word.slice(0, -suffix.length);
  }
  return word;
}

export function tokenize(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[’']s\b/g, "")
    .replace(/[^a-z0-9.\-\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[.\-]+|[.\-]+$/g, ""))
    .filter(Boolean);

  const tokens: string[] = [];
  for (const word of words) {
    if (STOPWORDS.has(word)) continue;
    const canonical = SYNONYMS.get(word) ?? SYNONYMS.get(stem(word)) ?? stem(word);
    if (canonical.length > 1) tokens.push(canonical);
  }
  return tokens;
}

export interface RetrievedFaq {
  entry: FaqEntry;
  /**
   * 0–1. Mostly coverage (share of the query's IDF-weighted terms found in
   * this FAQ, question terms counting double), plus a small precision bonus
   * so a focused FAQ beats one that merely mentions the topic in passing.
   */
  score: number;
  matchedTerms: string[];
}

interface IndexedFaq {
  entry: FaqEntry;
  questionTerms: Set<string>;
  answerTerms: Set<string>;
}

const indexCache = new WeakMap<FaqEntry[], { docs: IndexedFaq[]; idf: Map<string, number> }>();

function buildIndex(entries: FaqEntry[]) {
  const cached = indexCache.get(entries);
  if (cached) return cached;

  const docs = entries.map((entry) => ({
    entry,
    questionTerms: new Set(tokenize(`${entry.question} ${entry.category} ${entry.group}`)),
    answerTerms: new Set(tokenize(entry.answer)),
  }));

  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const t of new Set([...doc.questionTerms, ...doc.answerTerms])) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const n = Math.max(docs.length, 1);
  const idf = new Map<string, number>();
  for (const [t, count] of df) idf.set(t, Math.log(1 + n / count));

  const built = { docs, idf };
  indexCache.set(entries, built);
  return built;
}

export const RELEVANT_SCORE = 0.3;
export const STRONG_SCORE = 0.55;

export function retrieveFaqs(
  query: string,
  entries: FaqEntry[],
  { limit = 4, minScore = RELEVANT_SCORE }: { limit?: number; minScore?: number } = {},
): RetrievedFaq[] {
  if (entries.length === 0) return [];
  const terms = [...new Set(tokenize(query))];
  if (terms.length === 0) return [];

  const { docs, idf } = buildIndex(entries);
  // Unknown terms still count against the score (with a high IDF), so a
  // question about something absent from the dataset scores low.
  const unknownIdf = Math.log(1 + Math.max(docs.length, 1));
  const weight = (t: string) => idf.get(t) ?? unknownIdf;
  const maxScore = terms.reduce((sum, t) => sum + 2 * weight(t), 0);

  return docs
    .map(({ entry, questionTerms, answerTerms }) => {
      let raw = 0;
      let questionHits = 0;
      const matchedTerms: string[] = [];
      for (const t of terms) {
        if (questionTerms.has(t)) {
          raw += 2 * weight(t);
          questionHits++;
          matchedTerms.push(t);
        } else if (answerTerms.has(t)) {
          raw += weight(t);
          matchedTerms.push(t);
        }
      }
      const coverage = maxScore > 0 ? raw / maxScore : 0;
      const precision = questionTerms.size > 0 ? questionHits / questionTerms.size : 0;
      // Tiny tie-breaker: on equal relevance, prefer the more trustworthy entry.
      const trust = entry.verificationLevel === "verified" ? 0.02 : entry.verificationLevel === "unverified" ? 0 : 0.01;
      return { entry, score: Math.min(1, 0.8 * coverage + 0.2 * precision + trust), matchedTerms };
    })
    .filter((r) => r.score >= minScore && r.matchedTerms.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function isStrongMatch(result: RetrievedFaq | undefined): boolean {
  return !!result && result.score >= STRONG_SCORE;
}
