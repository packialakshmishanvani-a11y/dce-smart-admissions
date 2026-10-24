/**
 * Strips likely personal identifiers from text before it leaves the server
 * (Make/Notion log). Students sometimes paste phone numbers, emails, or
 * Aadhaar / registration numbers into questions.
 */
export function redactPersonalData(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[ID number removed]")
    .replace(/(?:\+?91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g, "[phone removed]")
    .replace(/\b\d{9,}\b/g, "[number removed]");
}

/** Patterns that should never appear in a student-facing answer. */
const SECRET_PATTERNS = [/AIza[0-9A-Za-z_-]{20,}/, /hook\.[a-z0-9]+\.make\.com/i, /GEMINI_API_KEY|MAKE_WEBHOOK_URL/];

export function containsSecretLikeText(text: string): boolean {
  return SECRET_PATTERNS.some((p) => p.test(text));
}
