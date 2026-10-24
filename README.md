# DCE Admissions Assistant — Capstone 49

A no-code-friendly FAQ chatbot for **Dhanalakshmi College of Engineering (DCE), Chennai**. Students and parents ask admission questions; the assistant answers only from a reviewed FAQ dataset, shows the source and verification level of every answer, says so honestly when it can't verify something, and logs those questions to Notion (via Make) for the admissions team.

Official college website: https://dce.edu.in/

> This is a student project, not an official admission channel. Fees, dates, and admission decisions are confirmed only by the college.

## Contents

- [How it works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Importing the FAQ CSV](#importing-the-faq-csv)
- [Configuring Gemini](#configuring-gemini)
- [Configuring the Make webhook](#configuring-the-make-webhook)
- [Running, testing, and building](#running-testing-and-building)
- [Deployment](#deployment)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Security notes](#security-notes)
- [Limitations and future improvements](#limitations-and-future-improvements)

## How it works

```
Student question
      │
      ▼
POST /api/chat ── validate (Zod) ── rate limit
      │
      ▼
Retrieve top FAQ entries (src/lib/faq/retrieveFaqs.ts)
      │
      ▼
Gemini, server-side, structured JSON reply:
  { status, answer, usedFaqIds, category }
      │
      ▼
Server checks the reply (src/lib/chat/answerQuestion.ts)
  • "answered" must cite FAQ IDs that were actually supplied, else → fallback
  • unverified sources → caveat added, needsReview = true
  • replies echoing the system prompt or secret-like text → discarded
      │
      ├── needsReview? → POST to Make webhook (4 s timeout) → Notion
      ▼
JSON response to the browser
```

**Trust levels.** The CSV's free-text *Verification Status* is mapped to one of four levels. Anything not clearly verified is treated as unverified.

| Level | Example CSV status | How the bot uses it |
|---|---|---|
| `verified` | "Verified against admissions page" | States it, keeping any caveat in the answer |
| `partial` | "Partially verified; confirm current regulations" | States it and asks the student to confirm |
| `unverified` | "Needs human verification" | Never presented as fact; points to the admissions office; logged for review |
| `policy` | "Policy response; do not promise outcomes" | A rule of the assistant (e.g. no admission guarantees) |

**When Gemini is unavailable.** If `GEMINI_API_KEY` is missing, the quota is exhausted, or Gemini times out:

- If the question strongly matches one FAQ, that FAQ answer is shown word for word (`mode: "faq-direct"`).
- Otherwise, with no key configured, the student gets the standard "couldn't verify" message.
- Otherwise (a temporary failure), the API returns `503` with `retryable: true` and the chat shows **Try again**. Nothing is logged, because the question may well be answerable.

## Prerequisites

- **Node.js 20.9 or newer** (tested on Node 22) and npm
- A **Google AI Studio** account for a Gemini API key (optional for local development; see above)
- A **Make** account with the scenario described below, connected to the Notion database `DCE Unanswered Questions Log`

## Installation

```bash
npm ci            # installs exactly what's in package-lock.json (recommended)
cp .env.example .env.local
```

If you use `npm install` instead and npm 10 stops with `Cannot read properties of null (reading 'edgesOut')`, that's a known npm bug with Vitest's optional peer dependencies. Run `npm install --legacy-peer-deps`, or just use `npm ci`.

## Environment variables

All variables are **server-only**. Never prefix them with `NEXT_PUBLIC_`: that would ship them to every visitor's browser. `.env.local` is listed in `.gitignore`.

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | For AI answers | Gemini API key. Without it the bot runs in FAQ-only mode. |
| `MAKE_WEBHOOK_URL` | For logging | URL of the Make "Custom Webhook" module. Without it nothing is logged. |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash`. Check Google's current model list and update if needed. |
| `GEMINI_TIMEOUT_MS` | No | Default `12000` |
| `MAKE_WEBHOOK_TIMEOUT_MS` | No | Default `4000` |
| `CHAT_RATE_LIMIT_PER_MINUTE` | No | Requests per client per minute. Default `12`. |

## Importing the FAQ CSV

The project ships with `data/DCE_Capstone49_FAQ_40.csv` and the generated `data/faqs.json`. After editing the CSV, or to import a different file:

```bash
npm run import:faqs                          # re-imports data/DCE_Capstone49_FAQ_40.csv
npm run import:faqs -- path/to/new-faqs.csv  # imports another file
```

The importer prints warnings for skipped rows and a count per verification level. Commit the updated `data/faqs.json`.

**Expected columns** (header names are matched case-insensitively):

| CSV column | Internal field | Notes |
|---|---|---|
| `FAQ ID` | `id` | Required; duplicates are skipped |
| `Category` | `category` | Kept as written; also mapped to a site group (below) |
| `Question` | `question` | Required |
| `Answer` | `answer` | Required |
| `Source URL` | `sourceUrl`, `sourceUrls` | Several URLs may be separated by `;` |
| `Verification Status` | `verificationStatus`, `verificationLevel` | See the trust levels table above |
| `Last Verified At` | `lastVerifiedAt` | Optional |
| `Group` | `group` | Optional; overrides the automatic group mapping |

**Group mapping.** The site shows eight topic cards. CSV categories are mapped onto them as follows:

- Deadlines → Admissions
- Intake → Courses
- Hostel, Transport, and Placements → Campus Facilities
- Human escalation → Contact & Support

FAQ-035 to FAQ-037 (phone, email, address) are moved to Contact & Support. To change any of this, add a `Group` column to the CSV, or edit `src/lib/faq/normalize.ts`.

The data layer is behind `FaqRepository` (`src/lib/faq/loadFaqs.ts`), so a database or vector store can replace the JSON file later without touching the API route or UI.

## Configuring Gemini

1. Go to https://aistudio.google.com/apikey and create an API key.
2. Put it in `.env.local` as `GEMINI_API_KEY=...`.
3. Restart `npm run dev`.

The key is sent only from the server, in the `x-goog-api-key` header. The integration calls the Gemini REST endpoint directly (`src/lib/ai/gemini.ts`) and uses structured JSON output, so the backend never has to guess from free text whether a question was answered. The system instructions are in `src/lib/ai/prompts.ts`.

The free tier has low rate limits. When Gemini returns `429`, students see a "please try again in a minute" message, or the matching FAQ answer if there's a strong match.

## Configuring the Make webhook

The existing scenario has two modules.

**1. Webhooks → Custom webhook**

1. Create the webhook and copy its URL into `MAKE_WEBHOOK_URL`.
2. To let Make learn the data structure, click **Redetermine data structure**.
3. While Make is listening, send this test payload (or ask the bot something it can't answer):

```bash
curl -X POST "$MAKE_WEBHOOK_URL" -H "Content-Type: application/json" -d '{
  "question": "Is there a swimming pool on campus?",
  "category": "General",
  "source_checked": "",
  "status": "New",
  "date_submitted": "2026-10-25",
  "chatbot_response": "I’m sorry, I couldn’t verify that information from the available DCE sources. Please check the official college website or contact the admissions office for confirmation."
}'
```

**2. Notion → Create a Data Source Item**

Use data source ID `40307a09-ce79-809d-8bf2-000b033cf0fe` and map the fields:

| Notion property | Type | Webhook field |
|---|---|---|
| Name | Title | `question` |
| Question | Rich text | `question` |
| Category | Select | `category` |
| Source Checked | URL | `source_checked` (empty when nothing was checked) |
| Status | Select | `status` (always `New`) |
| Date Submitted | Date | `date_submitted` (YYYY-MM-DD, India time) |
| Chatbot Response | Rich text | `chatbot_response` |

**Category select options.** Make sure the Category select includes `General` alongside the eight topics: Admissions, Courses, Eligibility, Fees, Scholarships, Documents, Campus Facilities, and Contact & Support. Questions that match no FAQ are sent as `General`.

**Turn the scenario on** and set it to run immediately when data arrives.

**What gets logged.** A question is logged only when it can't be answered reliably, or when the answer relies on an unverified FAQ. Clarifying questions, greetings, and off-topic chat are not logged.

**Safeguards on logging:**

- Phone numbers, emails, and 12-digit ID numbers are removed from the question before sending.
- The same question is logged at most once per 24 hours per server process.
- The request has a 4-second timeout.
- If logging fails, the student still gets their answer, and the chat never claims the question was logged. Only the failure reason (never the question or URL) is written to the server log.

## Running, testing, and building

```bash
npm run dev          # http://localhost:3000
npm run lint         # ESLint (Next.js core-web-vitals + TypeScript rules)
npm run typecheck    # tsc --noEmit
npm test             # 72 Vitest unit tests; all external calls are mocked
npm run build        # production build
npm start            # serve the production build
```

**End-to-end tests (Playwright)** run against a production build with no Gemini key and no webhook, so they're free and deterministic. They run twice, once at desktop size and once as a Pixel 7.

```bash
npx playwright install chromium   # first time only
npm run test:e2e                  # builds, starts on :3100, runs desktop + mobile
```

If you already have Chromium installed, set `PLAYWRIGHT_CHROMIUM_PATH=/path/to/chromium` instead of installing it.

**What the tests cover:**

- FAQ CSV parsing and normalization
- Retrieval
- Verified vs. partial vs. unverified answers
- Hallucinated or uncited answers
- Invalid and missing input
- Gemini quota, timeout, and malformed responses
- The webhook payload, redaction, deduplication, timeouts, and failures
- An empty dataset
- Prompt-injection attempts (forged tags, prompt-leak replies, secret-like output, forged history)
- Rate limiting
- The full chat flow in a browser

## Deployment

**Vercel (simplest)**

1. Push the repository to GitHub, without `.env.local`.
2. Import the repository in Vercel. It detects Next.js automatically.
3. Under **Settings → Environment Variables**, add `GEMINI_API_KEY` and `MAKE_WEBHOOK_URL` for Production (and Preview if you want).
4. Deploy, then ask an unknown question and check that a row appears in Notion.

**Any Node host or container**

```bash
npm ci && npm run build && npm start   # set env vars in the host, PORT to change the port
```

**Production checklist:**

- [ ] Real environment variables set; `.env.local` not committed
- [ ] Make scenario switched on; a test row arrived in Notion
- [ ] A shared rate limiter in place if you run more than one instance (see Limitations)
- [ ] Authorised DCE logo added in place of the placeholder (`src/components/ui/LogoMark.tsx`)
- [ ] FAQ verification statuses reviewed for the current admission cycle

## API reference

### `POST /api/chat`

**Request**

```json
{ "message": "What courses does DCE offer?", "history": [] }
```

- `message`: 1–500 characters.
- `history`: optional; at most 20 items of `{ role: "user" | "assistant", content }`.

**Response `200`**

```json
{
  "answer": "The answer based on verified sources.",
  "answered": true,
  "category": "Courses",
  "sourceUrl": "https://dce.edu.in/admissions-dce/",
  "needsReview": false,
  "clarification": false,
  "verification": "verified",
  "sources": [
    {
      "faqId": "FAQ-001",
      "question": "…",
      "url": "https://dce.edu.in/admissions-dce/",
      "urls": ["…"],
      "verificationLevel": "verified",
      "verificationStatus": "…"
    }
  ],
  "related": [],
  "logged": false,
  "mode": "ai"
}
```

The first five fields are the format from the project brief. The extra fields drive the UI:

- `verification`: the lowest trust level among the sources used.
- `related`: suggested follow-up questions.
- `logged`: `true` only if Make confirmed receipt.
- `mode`: `"ai"`, `"faq-direct"`, or `"fallback"`.

**Errors** come back as `{ "error": string, "retryable": boolean }`:

| Status | Meaning |
|---|---|
| `400` | Invalid input |
| `405` | Wrong method |
| `413` | Request too large |
| `429` | Rate limited; includes a `Retry-After` header |
| `503` | Gemini temporarily unavailable |
| `500` | Unexpected error |

## Project structure

```text
data/
  DCE_Capstone49_FAQ_40.csv     source FAQ data
  faqs.json                     generated by npm run import:faqs
scripts/import-faqs.ts          CSV → JSON importer
src/
  app/
    page.tsx                    home: hero, topics, how answers are checked, contact
    chat/page.tsx               chat page (?q= pre-fills the input)
    faqs/page.tsx               searchable FAQs (?category=fees etc.)
    api/chat/route.ts           the chat endpoint
  components/
    layout/                     Header (responsive menu), Footer
    chatbot/                    ChatWindow, ChatMessage, ChatInput, SuggestedQuestions
    faqs/                       FAQCategoryCard, FAQAccordion, FAQBrowser
    ui/                         VerificationBadge, LogoMark, button styles
  lib/
    ai/                         gemini.ts (REST client), prompts.ts (system rules, schema)
    chat/answerQuestion.ts      orchestration and server-side answer checks
    faq/                        csv.ts, normalize.ts, loadFaqs.ts, retrieveFaqs.ts, groups.ts
    integrations/makeWebhook.ts Make logging (timeout, dedupe, redaction)
    security/                   rateLimit.ts, redact.ts
    validation/chatSchema.ts    Zod request schema
  types/                        chat.ts, faq.ts
tests/
  unit/                         Vitest
  e2e/                          Playwright
```

**UI components.** These are small hand-written components in the shadcn/ui style (an accessible accordion, buttons, and badges) rather than the shadcn CLI. This avoids extra Radix dependencies for a handful of components. If you later need dialogs or menus, `npx shadcn@latest init` works alongside this setup.

**Fonts.** Public Sans and Source Serif 4 are bundled through Fontsource, so no request goes to Google Fonts at runtime.

## Security notes

- **Secrets stay on the server.** API keys and the webhook URL are read only in server modules (`import "server-only"`), are never logged, and are never included in error messages. A build check confirmed neither appears in `.next/static`.
- **Input is validated.** Zod checks every request, with length limits, a body-size cap, no caching, and basic security headers (`next.config.ts`).
- **Prompt injection is mitigated, not prevented.** No system can fully prevent it, so this one limits the damage instead:
  - Student text is wrapped in delimiters, and any forged delimiter tags are stripped.
  - The system rules tell the model to treat that text only as a question.
  - The model returns structured output, and any answer must cite FAQ IDs the server actually supplied.
  - A canary token detects replies that leak the system prompt, and secret-pattern checks catch key-like output.
  - Chat history from the browser is treated as untrusted context, never as a source.
- **Output is rendered as text.** User messages and AI answers are shown as React text nodes, never as HTML. Only `http(s)` URLs become links.
- **Logs are privacy-conscious.** Personal identifiers are removed before logging to Notion, and server logs never contain question text.

## Limitations and future improvements

- **Rate limiting is per process.** On serverless or multi-instance hosting, add a shared limiter such as Upstash Redis, or a Vercel or Cloudflare firewall rule.
- **Duplicate suppression is per process,** too. A Make "Data store" check or a Notion search step can add global deduplication.
- **Retrieval is lexical.** It uses term overlap with synonyms, which is fine for about 40 FAQs. For hundreds of entries, or Tamil and mixed-language questions, switch `retrieveFaqs` to embeddings without changing its return shape.
- **There is no live website checking.** The bot answers from the imported FAQs only, and it never claims otherwise. A scheduled job that re-checks source pages and flags changed ones would keep statuses current.
- **The dataset needs re-verification each cycle.** 18 of the 40 FAQs are marked as needing current-year checks (dates, fees, age limits, document lists). Re-verify them each admission cycle and re-import.
- **English only** for now.
- **Possible additions:** an admin view of logged questions, feedback buttons on answers, an analytics summary of common gaps, and an authorised logo and imagery.
