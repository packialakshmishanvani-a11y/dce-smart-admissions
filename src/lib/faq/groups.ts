import { FAQ_GROUPS, type FaqGroup } from "@/types/faq";

export interface GroupInfo {
  group: FaqGroup;
  slug: string;
  blurb: string;
}

export const GROUP_INFO: Record<FaqGroup, GroupInfo> = {
  Admissions: { group: "Admissions", slug: "admissions", blurb: "TNEA, management quota, lateral entry, and key dates" },
  Courses: { group: "Courses", slug: "courses", blurb: "Undergraduate and postgraduate programmes, seat intake" },
  Eligibility: { group: "Eligibility", slug: "eligibility", blurb: "Qualifying exams, subjects, and minimum marks" },
  Fees: { group: "Fees", slug: "fees", blurb: "How to get the official, current fee structure" },
  Scholarships: { group: "Scholarships", slug: "scholarships", blurb: "Government and institutional schemes" },
  Documents: { group: "Documents", slug: "documents", blurb: "Certificates and checklists for your admission route" },
  "Campus Facilities": { group: "Campus Facilities", slug: "campus-facilities", blurb: "Hostel, transport, and placements" },
  "Contact & Support": { group: "Contact & Support", slug: "contact", blurb: "Phone, email, address, and special cases" },
};

export const GROUP_LIST = FAQ_GROUPS.map((g) => GROUP_INFO[g]);

export function groupFromSlug(slug: string | undefined): FaqGroup | null {
  return GROUP_LIST.find((g) => g.slug === slug)?.group ?? null;
}

export const OFFICIAL_SITE = "https://dce.edu.in/";
export const OFFICIAL_ADMISSIONS = "https://dce.edu.in/admissions-dce/";
export const OFFICIAL_CONTACT = "https://dce.edu.in/contact/";
