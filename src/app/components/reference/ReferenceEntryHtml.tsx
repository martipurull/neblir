"use client";

import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { useMemo } from "react";
function isTiptapDoc(value: unknown): value is JSONContent {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    (value as JSONContent).type === "doc"
  );
}

export function ReferenceEntryHtml({
  contentJson,
  contentHtml,
}: {
  contentJson?: unknown;
  contentHtml?: string | null;
}) {
  const html = useMemo(() => {
    if (isTiptapDoc(contentJson)) {
      return generateHTML(contentJson, [StarterKit]);
    }
    return contentHtml?.trim() ?? "";
  }, [contentJson, contentHtml]);

  if (!html) {
    return <p className="text-sm italic text-black/50">No content yet.</p>;
  }

  return (
    <div
      className="reference-entry-html text-sm leading-relaxed text-black"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
