import Link from "next/link";
import { button } from "@/components/ui/styles";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-4xl font-semibold">Page not found</h1>
      <p className="mt-3 text-muted">That page doesn’t exist. You can ask the assistant or browse the FAQs instead.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/chat" className={button.primary}>Ask a question</Link>
        <Link href="/faqs" className={button.outline}>Browse FAQs</Link>
      </div>
    </div>
  );
}
