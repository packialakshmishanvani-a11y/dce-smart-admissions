import type { ChatResponse } from "@/types/chat";

export type UiMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; kind: "welcome"; content: string }
  | { id: string; role: "assistant"; kind: "answer"; content: string; response: ChatResponse }
  | { id: string; role: "assistant"; kind: "error"; content: string; retryable: boolean; question: string };

export const WELCOME =
  "Hello! I’m your DCE Admissions Assistant. I can help you with degree programs, Anna University/TNEA counseling eligibility, hostel facilities, tuition guidelines, and admission documents.";

export interface PromptCard {
  title: string;
  description: string;
  question: string;
  category: string;
}

export const PROMPT_CARDS: PromptCard[] = [
  {
    title: "B.E. & B.Tech Programs",
    description: "Explore 8 engineering programs including AI&DS, CSE, and Cyber Security.",
    question: "What undergraduate engineering courses and specializations are offered at DCE?",
    category: "Courses",
  },
  {
    title: "Eligibility & Cutoffs",
    description: "TNEA counseling norms, minimum marks, and admission requirements.",
    question: "What are the eligibility requirements and TNEA process for admission?",
    category: "Admissions",
  },
  {
    title: "Hostel & Campus Facilities",
    description: "On-campus student accommodation, dining, and Chennai transport routes.",
    question: "Does DCE provide hostel and transport facilities for students?",
    category: "Campus Facilities",
  },
  {
    title: "Fees & Scholarships",
    description: "Official fee inquiry channels, tuition details, and scholarship assistance.",
    question: "Where can I find official fee details and scholarship information?",
    category: "Fees",
  },
];

export const SUGGESTED_QUESTIONS = [
  "What courses does DCE offer?",
  "What are the admission eligibility requirements?",
  "What documents are required for admission?",
  "Does DCE have hostel and bus facilities?",
  "Where can I find official fee details?",
  "How do I contact the admissions office?",
];

export const QUICK_TOPIC_PILLS = [
  { label: "🎓 Courses", question: "What B.E. and B.Tech courses are offered at DCE?" },
  { label: "📋 Eligibility", question: "What are the eligibility requirements for admission?" },
  { label: "🏢 Hostels", question: "Tell me about hostel accommodation and dining at DCE." },
  { label: "🚌 Transport", question: "Does DCE have college bus transport facilities?" },
  { label: "📄 Documents", question: "What certificates and documents are needed for admission?" },
  { label: "📞 Contacts", question: "How can I contact the admissions office or college administration?" },
];
