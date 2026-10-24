import { Award, BookOpen, Building2, ClipboardCheck, FileText, IndianRupee, ListChecks, Phone, type LucideIcon } from "lucide-react";
import type { FaqGroup } from "@/types/faq";

export const GROUP_ICONS: Record<FaqGroup, LucideIcon> = {
  Admissions: ClipboardCheck,
  Courses: BookOpen,
  Eligibility: ListChecks,
  Fees: IndianRupee,
  Scholarships: Award,
  Documents: FileText,
  "Campus Facilities": Building2,
  "Contact & Support": Phone,
};
