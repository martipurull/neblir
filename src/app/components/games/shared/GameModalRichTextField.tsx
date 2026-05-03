"use client";

import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { RichTextToolbar } from "@/app/components/shared/RichTextToolbar";
import {
  GENERAL_INFORMATION_RICH_TEXT_EXTENSIONS,
  normalizeStoredHtmlForEditor,
  serializeEditorToStoredHtml,
} from "@/app/lib/tiptap/generalInformationRichText";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";

export type GameModalRichTextFieldProps = {
  id: string;
  label: string;
  /** Stored HTML (or legacy plain text — normalized on load). */
  value: string;
  onChange: (html: string) => void;
  disabled: boolean;
  required?: boolean;
  /**
   * Increment when the parent resets the form or loads new data so the editor
   * can replace its document without fighting typing updates.
   */
  syncKey: number;
};

/**
 * TipTap rich text for game modals (same StarterKit + toolbar as lore entries).
 * Values persist as HTML strings on the enemy model.
 */
export function GameModalRichTextField({
  id,
  label,
  value,
  onChange,
  disabled,
  required = false,
  syncKey,
}: GameModalRichTextFieldProps) {
  const editor = useEditor({
    extensions: GENERAL_INFORMATION_RICH_TEXT_EXTENSIONS,
    content: normalizeStoredHtmlForEditor(value),
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "outline-none text-sm text-white leading-relaxed focus:outline-none caret-white selection:bg-paleBlue/25 selection:text-black",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(serializeEditorToStoredHtml(ed.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.commands.setContent(normalizeStoredHtmlForEditor(value));
    // syncKey is the only intentional external sync trigger; `value` is read when it bumps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey, editor]);

  return (
    <div>
      <ModalFieldLabel id={id} label={label} required={required} />
      <div
        id={id}
        className="character-note-html rounded border-2 border-white/50 bg-transparent px-3 py-2 text-white shadow-sm [&_.ProseMirror]:min-h-[11rem] [&_.ProseMirror]:text-sm [&_.ProseMirror]:outline-none [&_.ProseMirror_a]:text-white [&_.ProseMirror_a]:underline"
      >
        {editor ? (
          <>
            <RichTextToolbar editor={editor} />
            <EditorContent editor={editor} />
          </>
        ) : (
          <p className="text-sm text-white/70">Loading editor…</p>
        )}
      </div>
    </div>
  );
}
