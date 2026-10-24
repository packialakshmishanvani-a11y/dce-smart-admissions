import { ArrowUpRight } from "lucide-react";

export function SuggestedQuestions({
  questions,
  onPick,
  label,
  disabled,
}: {
  questions: string[];
  onPick: (q: string) => void;
  label: string;
  disabled?: boolean;
}) {
  if (questions.length === 0) return null;
  return (
    <div role="group" aria-label={label} className="w-full">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <ul className="flex flex-wrap gap-2">
        {questions.map((q) => (
          <li key={q}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(q)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-left text-xs sm:text-sm font-medium text-navy-900 shadow-sm transition-all hover:border-cyan-600 hover:bg-cyan-wash/70 hover:shadow disabled:opacity-50"
            >
              <span>{q}</span>
              <ArrowUpRight className="size-3.5 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-ink" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
