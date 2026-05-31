"use client";

import { storedRichTextToDisplayHtml } from "@/app/lib/tiptap/richText";
import { useMemo } from "react";

type StoredRichTextHtmlProps = {
  content: string | null | undefined;
  className?: string;
};

/** Renders persisted TipTap HTML or legacy plain-text rich text copy. */
export function StoredRichTextHtml({
  content,
  className = "text-sm text-black",
}: StoredRichTextHtmlProps) {
  const html = useMemo(() => storedRichTextToDisplayHtml(content), [content]);
  if (!html) return null;
  return (
    <div
      className={`rich-text-content ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
