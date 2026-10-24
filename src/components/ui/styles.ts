/** Shared class recipes (shadcn-style variants without the extra dependency). */
const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 min-h-11";

export const button = {
  primary: `${base} bg-cyan-ink px-5 py-2.5 text-white hover:bg-cyan-deep`,
  navy: `${base} bg-navy-900 px-5 py-2.5 text-white hover:bg-navy-800`,
  outline: `${base} border border-line bg-white px-5 py-2.5 text-navy-900 hover:border-navy-700 hover:bg-navy-50`,
  light: `${base} bg-white px-5 py-2.5 text-navy-900 hover:bg-cyan-wash`,
  ghostOnDark: `${base} border border-white/30 px-5 py-2.5 text-white hover:bg-white/10`,
  quiet: `${base} min-h-9 px-3 py-1.5 text-sm text-muted hover:bg-navy-50 hover:text-navy-900`,
};
