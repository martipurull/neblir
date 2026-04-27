"use client";

import Button from "@/app/components/shared/Button";
import {
  GENERAL_INFORMATION_RICH_TEXT_EXTENSIONS,
  normalizeStoredHtmlForEditor,
  serializeEditorToStoredHtml,
} from "@/app/lib/tiptap/generalInformationRichText";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const editorShellClassName =
  "rounded-md border border-black/20 bg-paleBlue/40 px-2 py-2 focus-within:ring-2 focus-within:ring-customPrimaryHover";

/** Reuses global TipTap list/heading styles (see `globals.css` `.character-note-html`). */
const proseMirrorClassName =
  "character-note-html max-w-none px-2 py-1 text-sm text-black outline-none focus:outline-none [&_a]:text-customPrimary [&_a]:underline";

export type GeneralInformationRichTextFieldProps = {
  id: string;
  value: string | null | undefined;
  onChange: (html: string) => void;
  onBlur: () => void;
  /** Tailwind min-height class for the editable region (e.g. min-h-36). */
  minHeightClass?: string;
};

function RichTextToolbar({ editor }: { editor: Editor | null }) {
  const tool = useEditorState({
    editor,
    selector: ({ editor: ed, transactionNumber }) => {
      if (!ed || ed.isDestroyed) {
        return {
          bold: false,
          italic: false,
          h2: false,
          bullet: false,
          ordered: false,
          transactionNumber,
        };
      }
      return {
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        h2: ed.isActive("heading", { level: 2 }),
        bullet: ed.isActive("bulletList"),
        ordered: ed.isActive("orderedList"),
        transactionNumber,
      };
    },
  });

  if (!editor || editor.isDestroyed || !tool) return null;

  const toolBtn = (
    ariaLabel: string,
    action: () => void,
    isActive: boolean,
    children: React.ReactNode
  ) => (
    <Button
      type="button"
      variant="secondaryOutlineXs"
      fullWidth={false}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      title={ariaLabel}
      className={`inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center px-0 py-0 ${
        isActive ? "border-customPrimary bg-customPrimary/10" : ""
      }`}
      onClick={(e) => {
        e.preventDefault();
        action();
      }}
    >
      {children}
    </Button>
  );

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="mb-2 flex flex-wrap gap-2 border-b border-black/15 pb-2"
    >
      {toolBtn(
        "Bold",
        () => editor.chain().focus().toggleBold().run(),
        tool.bold,
        <span className="text-sm font-bold leading-none">B</span>
      )}
      {toolBtn(
        "Italic",
        () => editor.chain().focus().toggleItalic().run(),
        tool.italic,
        <span className="text-sm italic leading-none">I</span>
      )}
      {toolBtn(
        "Heading",
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        tool.h2,
        <span className="text-xs font-semibold leading-none tracking-tight">
          H<sup className="text-[0.7em] font-semibold">2</sup>
        </span>
      )}
      {toolBtn(
        "Bullet list",
        () => editor.chain().focus().toggleBulletList().run(),
        tool.bullet,
        <span
          className="flex flex-col items-start gap-0 py-1 leading-[0.55rem] text-[11px] font-semibold"
          aria-hidden
        >
          <span>•</span>
          <span>•</span>
          <span>•</span>
        </span>
      )}
      {toolBtn(
        "Numbered list",
        () => editor.chain().focus().toggleOrderedList().run(),
        tool.ordered,
        <span
          className="flex flex-col items-start gap-0 py-1 font-mono text-[10px] font-semibold leading-[0.55rem]"
          aria-hidden
        >
          <span>1.</span>
          <span>2.</span>
        </span>
      )}
    </div>
  );
}

export function GeneralInformationRichTextField({
  id,
  value,
  onChange,
  onBlur,
  minHeightClass = "min-h-36",
}: GeneralInformationRichTextFieldProps) {
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
    extensions: GENERAL_INFORMATION_RICH_TEXT_EXTENSIONS,
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

  if (!editor) {
    return (
      <div
        ref={wrapRef}
        className={`flex flex-col ${editorShellClassName} animate-pulse text-sm text-black/50 ${minHeightClass}`}
      >
        Loading editor…
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`flex flex-col ${editorShellClassName}`}
      onBlurCapture={handleContainerBlurCapture}
    >
      <RichTextToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
