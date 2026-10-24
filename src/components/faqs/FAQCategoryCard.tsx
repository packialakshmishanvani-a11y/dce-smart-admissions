import Link from "next/link";
import type { GroupInfo } from "@/lib/faq/groups";
import { GROUP_ICONS } from "./groupIcons";

export function FAQCategoryCard({ info, count }: { info: GroupInfo; count: number }) {
  const Icon = GROUP_ICONS[info.group];
  return (
    <Link
      href={`/faqs?category=${info.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition-[border-color,box-shadow] hover:border-navy-700 hover:shadow-lift"
    >
      <span className="grid size-11 place-items-center rounded-xl bg-navy-900 text-cyan-glow">
        <Icon aria-hidden className="size-5" />
      </span>
      <span className="mt-4 font-serif text-lg font-semibold text-navy-900">{info.group}</span>
      <span className="mt-1 text-sm text-muted">{info.blurb}</span>
      <span className="mt-auto pt-4 text-sm font-semibold text-cyan-ink group-hover:underline">
        {count} {count === 1 ? "question" : "questions"}
      </span>
    </Link>
  );
}
