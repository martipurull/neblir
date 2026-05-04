"use client";

import Button from "@/app/components/shared/Button";
import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import React from "react";

type RichTextToolbarProps = {
  editor: Editor | null;
};

export function RichTextToolbar({ editor }: RichTextToolbarProps) {
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
