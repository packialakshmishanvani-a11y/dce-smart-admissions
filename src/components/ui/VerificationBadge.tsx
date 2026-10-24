import { CircleAlert, CircleHelp, Scale, ShieldCheck } from "lucide-react";
import type { VerificationLevel } from "@/types/faq";

const STYLES: Record<VerificationLevel, { label: string; className: string; Icon: typeof ShieldCheck }> = {
  verified: { label: "Verified source", className: "bg-ok-wash text-ok", Icon: ShieldCheck },
  partial: { label: "Partly verified", className: "bg-warn-wash text-warn", Icon: CircleAlert },
  unverified: { label: "Not yet verified", className: "bg-risk-wash text-risk", Icon: CircleHelp },
  policy: { label: "Assistant policy", className: "bg-rule-wash text-rule", Icon: Scale },
};

export function VerificationBadge({ level, title }: { level: VerificationLevel; title?: string }) {
  const { label, className, Icon } = STYLES[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
      title={title}
    >
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}

export const VERIFICATION_EXPLAINERS: { level: VerificationLevel; text: string }[] = [
  { level: "verified", text: "Checked against an official DCE or TNEA page. Still worth confirming before you pay or submit." },
  { level: "partial", text: "Part of the answer is confirmed. The assistant will remind you what to double-check." },
  { level: "unverified", text: "Not confirmed for the current cycle. You’ll be pointed to the admissions office instead of given a guess." },
  { level: "policy", text: "How the assistant behaves — for example, it can’t promise anyone a seat." },
];
