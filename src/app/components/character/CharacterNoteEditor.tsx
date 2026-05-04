"use client";

import {
  EMPTY_NOTE_DOC,
  CHARACTER_NOTE_EXTENSIONS,
} from "@/app/lib/tiptap/characterNote";
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useLayoutEffect, useRef } from "react";
export interface CharacterNoteEditorProps {
  initialDoc: JSONContent;
  /**
   * Called after the user pauses typing (debounced) and once more when the editor unmounts
   * so pending changes are not lost.
   */
  onDebouncedDoc: (doc: JSONContent) => void;
  /** Debounce delay in ms. */
  debounceMs?: number;
  className?: string;
}

export function CharacterNoteEditor({
  initialDoc,
  onDebouncedDoc,
  debounceMs = 550,
  className = "",
}: CharacterNoteEditorProps) {
  const onDebouncedDocRef = useRef(onDebouncedDoc);
  useLayoutEffect(() => {
    onDebouncedDocRef.current = onDebouncedDoc;
  }, [onDebouncedDoc]);

  const editor = useEditor({
    extensions: CHARACTER_NOTE_EXTENSIONS,
    content: initialDoc ?? EMPTY_NOTE_DOC,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[11rem] outline-none text-sm text-paleBlue leading-relaxed focus:outline-none caret-paleBlue selection:bg-paleBlue/25 selection:text-black",
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const flush = () => {
      if (editor.isDestroyed) return;
      onDebouncedDocRef.current(editor.getJSON());
    };

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(flush, debounceMs);
    };

    editor.on("update", schedule);
    return () => {
      editor.off("update", schedule);
      if (timeout) clearTimeout(timeout);
      flush();
    };
  }, [editor, debounceMs]);

  if (!editor) {
    return (
      <div className="min-h-[12rem] rounded border border-paleBlue/25 bg-modalBackground-200 px-3 py-2 text-sm text-paleBlue">
        Loading editor…
      </div>
    );
  }

  return (
    <div
      className={`rounded border border-paleBlue/25 bg-modalBackground-200 px-3 py-2 text-paleBlue shadow-sm [&_.ProseMirror_a]:text-paleBlue [&_.ProseMirror_a]:underline [&_.ProseMirror_strong]:text-paleBlue ${className}`.trim()}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
