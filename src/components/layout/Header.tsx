"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bot, ExternalLink, Menu, MessageCircle, X } from "lucide-react";
import { LogoMark } from "@/components/ui/LogoMark";
import { button } from "@/components/ui/styles";
import { OFFICIAL_SITE } from "@/lib/faq/groups";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About" },
  { href: "/faqs", label: "Admissions" },
  { href: "/#contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu after navigating.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg text-navy-900">
          <LogoMark />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-serif text-base font-semibold sm:text-lg">Dhanalakshmi College of Engineering</span>
            <span className="block text-xs text-muted">Admissions assistant</span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-navy-50 hover:text-navy-900 aria-[current=page]:text-navy-900 aria-[current=page]:underline aria-[current=page]:decoration-cyan-accent aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={OFFICIAL_SITE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-navy-50 hover:text-navy-900"
          >
            dce.edu.in
            <ExternalLink aria-hidden className="size-3.5" />
            <span className="sr-only">(official website, opens in a new tab)</span>
          </a>
          <Link
            href="/chat"
            className="ml-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-700 via-cyan-600 to-navy-900 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-cyan-300/40 transition-all hover:opacity-95 hover:shadow hover:scale-[1.02] active:scale-[0.98]"
          >
            <Bot className="size-4 text-cyan-200" />
            <span>Admissions AI</span>
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 beacon-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
          </Link>
        </nav>

        <button
          type="button"
          className="ml-auto grid size-11 place-items-center rounded-xl text-navy-900 hover:bg-navy-50 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-line bg-white px-4 pb-5 pt-2 lg:hidden">
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-navy-900 hover:bg-navy-50"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={OFFICIAL_SITE} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-navy-900 hover:bg-navy-50">
                Official website <ExternalLink aria-hidden className="size-4" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          </ul>
          <Link href="/chat" onClick={() => setOpen(false)} className={`${button.primary} mt-3 w-full`}>
            <MessageCircle aria-hidden className="size-4" />
            Ask Admissions AI
          </Link>
        </nav>
      )}
    </header>
  );
}
