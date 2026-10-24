import { Fragment, type ReactNode } from "react";

const URL_PATTERN = /(https?:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:!?])/g;

/**
 * Renders plain text with http(s) URLs turned into links. Everything is
 * rendered as React text nodes — never as HTML — so model or user output
 * can't inject markup or javascript: links.
 */
export function linkify(text: string): ReactNode[] {
  return text.split(URL_PATTERN).map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-cyan-ink underline underline-offset-2">
        {part}
      </a>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
