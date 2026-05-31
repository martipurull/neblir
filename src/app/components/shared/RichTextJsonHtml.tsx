"use client";

import { storedRichTextJsonToHtml } from "@/app/lib/tiptap/richTextJsonDoc";
import { useMemo, type ReactNode } from "react";

type RichTextJsonHtmlProps = {
  content: string;
  /** Shown when the document is visually empty. */
  emptyFallback?: ReactNode;
  className?: string;
};

/** Renders persisted TipTap JSON (or legacy plain text) as HTML. */
export function RichTextJsonHtml({
  content,
  emptyFallback = <p className="text-sm italic text-black/40">Empty note</p>,
  className = "text-sm text-black",
}: RichTextJsonHtmlProps) {
  const html = useMemo(() => storedRichTextJsonToHtml(content), [content]);
  if (!html) {
    return emptyFallback;
  }
  return (
    <div
      className={`rich-text-content ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
