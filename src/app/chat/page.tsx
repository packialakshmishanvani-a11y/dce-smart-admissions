import type { Metadata } from "next";
import { ChatWindow } from "@/components/chatbot/ChatWindow";

export const metadata: Metadata = { title: "DCE Admissions AI Assistant • Ask Questions" };

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  const initialQuestion = (Array.isArray(q) ? q[0] : q) ?? "";

  return (
    <div className="mx-auto h-[calc(100dvh-4.25rem)] max-w-5xl px-2 py-2 sm:px-6 sm:py-4">
      <ChatWindow initialQuestion={initialQuestion} />
    </div>
  );
}
