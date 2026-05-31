"use client";

import { RichTextToolbar } from "@/app/components/shared/RichTextToolbar";
import {
  RICH_TEXT_EXTENSIONS,
  normalizeStoredHtmlForEditor,
  serializeEditorToStoredHtml,
} from "@/app/lib/tiptap/richText";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type FocusEvent,
} from "react";

const editorShellClassName =
  "rounded-md border border-black/20 bg-paleBlue/40 px-2 py-2 focus-within:ring-2 focus-within:ring-customPrimaryHover";

/** Reuses global TipTap list/heading styles (see `globals.css` `.rich-text-content`). */
const proseMirrorClassName =
  "rich-text-content max-w-none px-2 py-1 text-sm text-black outline-none focus:outline-none [&_a]:text-customPrimary [&_a]:underline";

export type RichTextFieldProps = {
  id: string;
  value: string | null | undefined;
  onChange: (html: string) => void;
  onBlur: () => void;
  /** Tailwind min-height class for the editable region (e.g. min-h-36). */
  minHeightClass?: string;
  /**
   * Classes on the TipTap `EditorContent` root (e.g. `max-h-[…] overflow-y-auto min-h-0`)
   * so long HTML cannot stretch the whole page inside scroll layouts.
   */
  editorContentClassName?: string;
};

export function RichTextField({
  id,
  value,
  onChange,
  onBlur,
  minHeightClass = "min-h-36",
  editorContentClassName,
}: RichTextFieldProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const debounceMs = 400;

  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const flushToForm = useCallback((editor: Editor) => {
    if (editor.isDestroyed) return;
    const next = serializeEditorToStoredHtml(editor.getHTML());
    onChangeRef.current(next);
  }, []);

  const editor = useEditor({
    extensions: RICH_TEXT_EXTENSIONS,
    content: normalizeStoredHtmlForEditor(value),
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
    const target = value?.trim() ? value.trim() : "";
    if (serializeEditorToStoredHtml(editor.getHTML()) === target) return;
    editor.commands.setContent(normalizeStoredHtmlForEditor(value), {
      emitUpdate: false,
    });
  }, [value, editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const dom = editor.view.dom as HTMLElement;
    const flush = () => flushToForm(editor);
    dom.addEventListener("blur", flush, true);
    return () => dom.removeEventListener("blur", flush, true);
  }, [editor, flushToForm]);

  const handleContainerBlurCapture = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
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
