import { describe, expect, it } from "vitest";
import { isStrongMatch, retrieveFaqs, tokenize } from "@/lib/faq/retrieveFaqs";
import { faqs } from "./helpers";

const top = (q: string) => retrieveFaqs(q, faqs)[0]?.entry.id;

describe("FAQ retrieval", () => {
  it.each([
    ["What courses does DCE offer?", "FAQ-001"],
    ["Does DCE offer postgraduate programmes?", "FAQ-002"],
    ["What is DCE's TNEA counselling code?", "FAQ-005"],
    ["How do I contact the admissions office?", "FAQ-035"],
    ["Is there a hostel?", "FAQ-030"],
    ["What is the cutoff for OC category?", "FAQ-013"],
    ["Where can I find official fee details?", "FAQ-024"],
    ["Can diploma holders get lateral entry?", "FAQ-009"],
    ["highest placement package", "FAQ-033"],
    ["Will I definitely be admitted? Is admission guaranteed?", "FAQ-038"],
  ])("%s → %s", (question, id) => {
    expect(top(question)).toBe(id);
  });

  it("understands synonyms", () => {
    expect(tokenize("Tuition cost for B.Tech branches")).toEqual(["fee", "fee", "undergraduate", "programme"]);
  });

  it("returns nothing for questions outside the dataset", () => {
    expect(retrieveFaqs("Is there a swimming pool?", faqs)).toEqual([]);
    expect(retrieveFaqs("hi there", faqs)).toEqual([]);
  });

  it("marks strong matches only when most of the question is covered", () => {
    expect(isStrongMatch(retrieveFaqs("TNEA code", faqs)[0])).toBe(true);
    expect(isStrongMatch(retrieveFaqs("bus facility near Tambaram station timing", faqs)[0])).toBe(false);
  });

  it("handles an empty dataset", () => {
    expect(retrieveFaqs("What courses does DCE offer?", [])).toEqual([]);
  });

  it("caps the number of results", () => {
    expect(retrieveFaqs("admission eligibility documents fees", faqs, { limit: 2 }).length).toBeLessThanOrEqual(2);
  });
});
