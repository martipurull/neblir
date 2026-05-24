"use client";

import { storedRichTextToDisplayHtml } from "@/app/lib/tiptap/generalInformationRichText";
import { useMemo } from "react";

type StoredRichTextHtmlProps = {
  content: string | null | undefined;
  className?: string;
};

/** Renders TipTap HTML or legacy plain-text path/item copy. */
export function StoredRichTextHtml({
  content,
  className = "text-sm text-black",
}: StoredRichTextHtmlProps) {
  const html = useMemo(() => storedRichTextToDisplayHtml(content), [content]);
  if (!html) return null;
  return (
    <div
      className={`character-note-html ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
