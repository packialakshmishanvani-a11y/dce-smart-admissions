import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseCsv, parseCsvRecords } from "@/lib/faq/csv";
import { faqDatasetSchema, normalizeFaqRecords, parseSourceUrls, toVerificationLevel } from "@/lib/faq/normalize";
import { faqs } from "./helpers";

describe("CSV parsing", () => {
  it("handles BOM, quoted commas, escaped quotes, newlines and CRLF", () => {
    const rows = parseCsv('\uFEFFa,b\r\n"x, y","say ""hi""\nthere"\r\n');
    expect(rows).toEqual([["a", "b"], ["x, y", 'say "hi"\nthere']]);
  });

  it("rejects an unterminated quote", () => {
    expect(() => parseCsv('a\n"oops')).toThrow(/unterminated/);
  });
});

describe("FAQ normalization", () => {
  it("maps free-text verification statuses conservatively", () => {
    expect(toVerificationLevel("Verified against admissions page")).toBe("verified");
    expect(toVerificationLevel("Official external source; check current cycle")).toBe("verified");
    expect(toVerificationLevel("Partially verified; confirm current regulations")).toBe("partial");
    expect(toVerificationLevel("Needs human verification")).toBe("unverified");
    expect(toVerificationLevel("Human review required")).toBe("unverified");
    expect(toVerificationLevel("Policy response; do not promise outcomes")).toBe("policy");
    expect(toVerificationLevel("")).toBe("unverified");
    expect(toVerificationLevel("Looks fine to me")).toBe("unverified");
  });

  it("splits multi-source cells and drops non-URLs", () => {
    expect(parseSourceUrls("https://dce.edu.in/admissions-dce/ ; https://www.tneaonline.org/")).toEqual([
      "https://dce.edu.in/admissions-dce/",
      "https://www.tneaonline.org/",
    ]);
    expect(parseSourceUrls("see website; javascript:alert(1)")).toEqual([]);
  });

  it("skips incomplete and duplicate rows with warnings", () => {
    const { entries, warnings } = normalizeFaqRecords([
      { "FAQ ID": "A", Category: "Fees", Question: "Q?", Answer: "Ans", "Source URL": "", "Verification Status": "Verified" },
      { "FAQ ID": "A", Category: "Fees", Question: "Q2?", Answer: "Ans", "Source URL": "", "Verification Status": "" },
      { "FAQ ID": "B", Category: "Fees", Question: "", Answer: "Ans", "Source URL": "", "Verification Status": "" },
      { "FAQ ID": "C", Category: "Alumni", Question: "Q3?", Answer: "Ans", "Source URL": "", "Verification Status": "" },
    ]);
    expect(entries.map((e) => e.id)).toEqual(["A", "C"]);
    expect(entries[1].group).toBe("Contact & Support");
    expect(warnings).toHaveLength(3);
  });

  it("imports the project CSV into the committed dataset", () => {
    const csv = readFileSync(path.join(__dirname, "../../data/DCE_Capstone49_FAQ_40.csv"), "utf8");
    const { entries, warnings } = normalizeFaqRecords(parseCsvRecords(csv));
    expect(warnings).toEqual([]);
    expect(entries).toHaveLength(40);
    expect(entries).toEqual(faqs);
    expect(faqDatasetSchema.safeParse(faqs).success).toBe(true);
  });

  it("files contact and facility questions under the student-facing groups", () => {
    const byId = Object.fromEntries(faqs.map((f) => [f.id, f]));
    expect(byId["FAQ-035"].group).toBe("Contact & Support");
    expect(byId["FAQ-030"].group).toBe("Campus Facilities");
    expect(byId["FAQ-019"].group).toBe("Admissions");
    expect(byId["FAQ-022"].verificationLevel).toBe("unverified");
  });
});
