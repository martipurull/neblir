"use client";

import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { modalInputClass } from "@/app/components/games/shared/modalStyles";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { RichTextToolbar } from "@/app/components/shared/RichTextToolbar";
import { EMPTY_NOTE_DOC } from "@/app/lib/tiptap/characterNote";
import { GENERAL_INFORMATION_RICH_TEXT_EXTENSIONS } from "@/app/lib/tiptap/generalInformationRichText";
import {
  createReferenceEntry,
  updateReferenceEntry,
} from "@/lib/api/referenceEntries";
import type {
  ReferenceAccess,
  ReferenceEntry,
} from "@/app/lib/types/reference";
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import React, { useEffect, useMemo, useState } from "react";

type CreateGameLoreEntryModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  mode?: "create" | "edit";
  entry?: ReferenceEntry | null;
  onClose: () => void;
  onSuccess?: () => void;
};

function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const fallback = "lore-entry";
  return `${base || fallback}-${Date.now().toString(36)}`;
}

export default function CreateGameLoreEntryModal({
  isOpen,
  gameId,
  gameName,
  mode = "create",
  entry = null,
  onClose,
  onSuccess,
}: CreateGameLoreEntryModalProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [access, setAccess] = useState<ReferenceAccess>("PLAYER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: GENERAL_INFORMATION_RICH_TEXT_EXTENSIONS,
    content: EMPTY_NOTE_DOC,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[11rem] outline-none text-sm text-white leading-relaxed focus:outline-none caret-white selection:bg-white/25 selection:text-black",
      },
    },
  });
  const isEditMode = mode === "edit" && Boolean(entry);

  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode && entry) {
      setTitle(entry.title);
      setSummary(entry.summary ?? "");
      setTagsInput(entry.tags.join(", "));
      setAccess(entry.access);
      const editorContent =
        entry.contentJson && typeof entry.contentJson === "object"
          ? entry.contentJson
          : (entry.contentHtml ?? EMPTY_NOTE_DOC);
      editor?.commands.setContent(editorContent);
      return;
    }
    setTitle("");
    setSummary("");
    setTagsInput("");
    setAccess("PLAYER");
    editor?.commands.setContent(EMPTY_NOTE_DOC);
  }, [isOpen, isEditMode, entry, editor]);

  const submitDisabled = useMemo(
    () => submitting || title.trim().length === 0,
    [submitting, title]
  );

  const resetForm = () => {
    setError(null);
    setTitle("");
    setSummary("");
    setTagsInput("");
    setAccess("PLAYER");
    editor?.commands.setContent(EMPTY_NOTE_DOC);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const contentJson: JSONContent = editor?.getJSON() ?? EMPTY_NOTE_DOC;
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      if (isEditMode && entry) {
        await updateReferenceEntry(entry.id, {
          title: trimmedTitle,
          summary: summary.trim() || null,
          access,
          tags,
          contentJson,
        });
      } else {
        await createReferenceEntry({
          category: "CAMPAIGN_LORE",
          gameId,
          title: trimmedTitle,
          slug: slugifyTitle(trimmedTitle),
          summary: summary.trim() || null,
          access,
          tags,
          sortOrder: 0,
          contentJson,
        });
      }
      resetForm();
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditMode
            ? "Could not update lore entry."
            : "Could not create lore entry."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GameFormModal
      isOpen={isOpen}
      title={`${isEditMode ? "Edit" : "Create"} lore entry — ${gameName}`}
      subtitle={
        isEditMode
          ? "Update this campaign lore note linked to this game."
          : "Add a campaign lore note linked to this game."
      }
      titleId="create-game-lore-entry-title"
      error={error}
      onClose={handleClose}
      onSubmit={(e) => void handleSubmit(e)}
      submitting={submitting}
      submitLabel={isEditMode ? "Save lore entry" : "Create lore entry"}
      submittingLabel={isEditMode ? "Saving…" : "Creating…"}
      submitDisabled={submitDisabled}
    >
      <div>
        <ModalFieldLabel id="game-lore-title" label="Title" required />
        <input
          id="game-lore-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={modalInputClass}
          placeholder="e.g. The Fall of Arithem"
          disabled={submitting}
        />
      </div>

      <div>
        <ModalFieldLabel id="game-lore-summary" label="Summary" />
        <textarea
          id="game-lore-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className={`${modalInputClass} min-h-[88px]`}
          placeholder="Optional short summary"
          disabled={submitting}
          rows={3}
        />
      </div>

      <div>
        <ModalFieldLabel id="game-lore-tags" label="Tags" />
        <input
          id="game-lore-tags"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className={modalInputClass}
          placeholder="e.g. history, factions, city"
          disabled={submitting}
        />
        <p className="mt-1 text-xs text-white/70">Separate tags with commas.</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-white lg:text-center">
          Access
        </p>
        <RadioGroup
          name="game-lore-access"
          value={access}
          onChange={(value) => setAccess(value as ReferenceAccess)}
          options={[
            { value: "PLAYER", label: "Player" },
            { value: "GAME_MASTER", label: "Game master" },
          ]}
          tone="inverse"
          variant="boxed"
          disabled={submitting}
        />
      </div>

      <div>
        <ModalFieldLabel id="game-lore-content" label="Content" />
        <div
          id="game-lore-content"
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
    </GameFormModal>
  );
}
