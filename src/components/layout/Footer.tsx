import Link from "next/link";
import { OFFICIAL_CONTACT, OFFICIAL_SITE } from "@/lib/faq/groups";

export function Footer() {
  return (
    <footer className="border-t border-line bg-navy-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-muted sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-serif text-base font-semibold text-navy-900">DCE Admissions Assistant</p>
          <p className="mt-2 max-w-md">
            A student project (Capstone 49) that answers common admission questions from a reviewed FAQ dataset. It is not an
            official channel: admission decisions, fees, and dates are confirmed only by the college.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="font-semibold text-navy-900">Explore</p>
          <ul className="mt-2 space-y-1.5">
            <li><Link className="hover:text-navy-900 hover:underline" href="/chat">Ask a question</Link></li>
            <li><Link className="hover:text-navy-900 hover:underline" href="/faqs">Browse FAQs</Link></li>
            <li><Link className="hover:text-navy-900 hover:underline" href="/#about">How answers are checked</Link></li>
          </ul>
        </nav>
        <div>
          <p className="font-semibold text-navy-900">Official sources</p>
          <ul className="mt-2 space-y-1.5">
            <li><a className="hover:text-navy-900 hover:underline" href={OFFICIAL_SITE} target="_blank" rel="noopener noreferrer">dce.edu.in</a></li>
            <li><a className="hover:text-navy-900 hover:underline" href={OFFICIAL_CONTACT} target="_blank" rel="noopener noreferrer">DCE contact page</a></li>
            <li><a className="hover:text-navy-900 hover:underline" href="https://www.tneaonline.org/" target="_blank" rel="noopener noreferrer">TNEA portal</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
