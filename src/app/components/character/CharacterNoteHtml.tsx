// eslint-disable-next-line no-unused-expressions
"use client";

import { characterNoteStoredToHtml } from "@/app/lib/tiptap/characterNote";
import React, { useMemo } from "react";

export function CharacterNoteHtml({ content }: { content: string }) {
  const html = useMemo(() => characterNoteStoredToHtml(content), [content]);
  if (!html) {
    return <p className="text-sm italic text-black/40">Empty note</p>;
  }
  return (
    <div
      className="character-note-html text-sm text-black"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
