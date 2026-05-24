"use client";

import { RichTextToolbar } from "@/app/components/shared/RichTextToolbar";
import { EMPTY_NOTE_DOC, isNoteDocEmpty } from "@/app/lib/tiptap/characterNote";
import { GENERAL_INFORMATION_RICH_TEXT_EXTENSIONS } from "@/app/lib/tiptap/generalInformationRichText";
import type { Editor, JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const editorShellClassName =
  "rounded-md border border-black/20 bg-paleBlue/40 px-2 py-2 focus-within:ring-2 focus-within:ring-customPrimaryHover";

const proseMirrorClassName =
  "character-note-html max-w-none px-2 py-1 text-sm text-black outline-none focus:outline-none [&_a]:text-customPrimary [&_a]:underline";

function parseEditorDoc(value: JSONContent | null | undefined): JSONContent {
  if (
    value &&
    typeof value === "object" &&
    value.type === "doc" &&
    Array.isArray(value.content)
  ) {
    return value;
  }
  return EMPTY_NOTE_DOC;
}

function docsEqual(a: JSONContent, b: JSONContent): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export type GeneralInformationRichTextJsonFieldProps = {
  id: string;
  value: JSONContent | null | undefined;
  onChange: (doc: JSONContent) => void;
  onBlur: () => void;
  minHeightClass?: string;
  editorContentClassName?: string;
};

/** Light-page TipTap editor that reads/writes a TipTap JSON document (e.g. reference `contentJson`). */
export function GeneralInformationRichTextJsonField({
  id,
  value,
  onChange,
  onBlur,
  minHeightClass = "min-h-36",
  editorContentClassName,
}: GeneralInformationRichTextJsonFieldProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const debounceMs = 400;

  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const flushToForm = useCallback((editor: Editor) => {
    if (editor.isDestroyed) return;
    onChangeRef.current(editor.getJSON());
  }, []);

  const editor = useEditor({
    extensions: GENERAL_INFORMATION_RICH_TEXT_EXTENSIONS,
    content: parseEditorDoc(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
        class: `${proseMirrorClassName} ${minHeightClass}`,
        "aria-multiline": "true",
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    let timeout: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => flushToForm(editor), debounceMs);
    };

    editor.on("update", schedule);
    return () => {
      editor.off("update", schedule);
      if (timeout) clearTimeout(timeout);
      flushToForm(editor);
    };
  }, [editor, flushToForm]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (wrapRef.current?.contains(document.activeElement)) return;
    const next = parseEditorDoc(value);
    if (docsEqual(editor.getJSON(), next)) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const dom = editor.view.dom as HTMLElement;
    const flush = () => flushToForm(editor);
    dom.addEventListener("blur", flush, true);
    return () => dom.removeEventListener("blur", flush, true);
  }, [editor, flushToForm]);

  const handleContainerBlurCapture = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      const el = wrapRef.current;
      if (!el || !editor || editor.isDestroyed) return;
      const related = e.relatedTarget as Node | null;
      if (related && el.contains(related)) return;
      flushToForm(editor);
      onBlur();
    },
    [editor, flushToForm, onBlur]
  );

  const contentShell = editorContentClassName?.trim();

  if (!editor) {
    return (
      <div
        ref={wrapRef}
        className={`flex min-h-0 flex-col ${editorShellClassName} animate-pulse text-sm text-black/50 ${minHeightClass} ${contentShell ?? ""}`.trim()}
      >
        Loading editor…
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`flex min-h-0 flex-col ${editorShellClassName}`}
      onBlurCapture={handleContainerBlurCapture}
    >
      <RichTextToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className={contentShell ? `${contentShell} min-h-0` : "min-h-0"}
      />
    </div>
  );
}

/** TipTap doc → API `contentJson` (null when visually empty). */
export function contentJsonForApi(
  doc: JSONContent | null | undefined
): JSONContent | null {
  const parsed = parseEditorDoc(doc);
  return isNoteDocEmpty(parsed) ? null : parsed;
}
