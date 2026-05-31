"use client";

import {
  storedNoteContentToDisplayHtml,
  storedRichTextToDisplayHtml,
} from "@/app/lib/tiptap/richText";
import { useMemo } from "react";

type StoredRichTextHtmlProps = {
  content: string | null | undefined;
  className?: string;
  /** Accept legacy TipTap JSON note envelopes (character notes). */
  legacyNoteContent?: boolean;
};

/** Renders persisted TipTap HTML or legacy plain-text rich text copy. */
export function StoredRichTextHtml({
  content,
  className = "text-sm text-black",
  legacyNoteContent = false,
}: StoredRichTextHtmlProps) {
  const html = useMemo(
    () =>
      legacyNoteContent
        ? storedNoteContentToDisplayHtml(content)
        : storedRichTextToDisplayHtml(content),
    [content, legacyNoteContent]
  );
  if (!html) return null;
  return (
    <div
      className={`rich-text-content ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
