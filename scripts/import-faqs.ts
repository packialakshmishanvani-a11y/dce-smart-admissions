/**
 * Imports the DCE FAQ CSV into data/faqs.json.
 *
 *   npm run import:faqs                       # uses data/DCE_Capstone49_FAQ_40.csv
 *   npm run import:faqs -- path/to/file.csv   # any CSV with the same columns
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseCsvRecords } from "../src/lib/faq/csv";
import { faqDatasetSchema, normalizeFaqRecords } from "../src/lib/faq/normalize";

const root = path.resolve(__dirname, "..");
const input = path.resolve(process.argv[2] ?? path.join(root, "data/DCE_Capstone49_FAQ_40.csv"));
const output = path.join(root, "data/faqs.json");

const { entries, warnings } = normalizeFaqRecords(parseCsvRecords(readFileSync(input, "utf8")));
faqDatasetSchema.parse(entries);

writeFileSync(output, JSON.stringify(entries, null, 2) + "\n");

for (const w of warnings) console.warn(`warning: ${w}`);
const counts = entries.reduce<Record<string, number>>((acc, e) => {
  acc[e.verificationLevel] = (acc[e.verificationLevel] ?? 0) + 1;
  return acc;
}, {});
console.log(`Imported ${entries.length} FAQs from ${path.relative(root, input)} into data/faqs.json`);
console.log(`Verification levels: ${JSON.stringify(counts)}`);
