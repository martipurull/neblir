"use client";

import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { TextField } from "@/app/components/shared/TextField";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { TextArea } from "@/app/components/shared/TextArea";
import { Button } from "@/app/components/shared/Button";
import { RichTextToolbar } from "@/app/components/shared/RichTextToolbar";
import { EMPTY_RICH_TEXT_DOC } from "@/app/lib/tiptap/richTextJsonDoc";
import { RICH_TEXT_EXTENSIONS } from "@/app/lib/tiptap/richText";
import {
  IMAGE_MAX_SIZE_BYTES,
  IMAGE_MAX_SIZE_LABEL,
  PDF_MAX_SIZE_BYTES,
  PDF_MAX_SIZE_LABEL,
} from "@/app/lib/constants/uploadLimits";
import {
  createReferenceEntry,
  updateReferenceEntry,
} from "@/lib/api/referenceEntries";
import {
  createReferenceEntryAttachment,
  deleteReferenceEntryAttachment,
  deleteUploadedLoreFile,
  getReferenceEntryAttachments,
  requestLoreAttachmentUploadUrl,
  uploadLoreFileToStorage,
} from "@/lib/api/loreAttachments";
import type {
  ReferenceAccess,
  ReferenceEntry,
} from "@/app/lib/types/reference";
import type { ReferenceEntryAttachment } from "@/app/lib/types/referenceEntryAttachment";
import { isImageFileName, isPdfFileName } from "@/app/lib/r2UploadKeys";
import type { JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import useSWR from "swr";

type CreateGameLoreEntryModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  mode?: "create" | "edit";
  entry?: ReferenceEntry | null;
  onClose: () => void;
  onSuccess?: () => void;
};

type PendingLoreAttachment = {
  fileKey: string;
  fileName: string;
  fileSizeBytes: number;
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

export function CreateGameLoreEntryModal({
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
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingLoreAttachment[]
  >([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    string | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: RICH_TEXT_EXTENSIONS,
    content: EMPTY_RICH_TEXT_DOC,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[11rem] outline-none text-sm text-white leading-relaxed focus:outline-none caret-white selection:bg-paleBlue/25 selection:text-black",
      },
    },
  });
  const isEditMode = mode === "edit" && Boolean(entry);

  const { data: existingAttachments = [], mutate: mutateAttachments } = useSWR<
    ReferenceEntryAttachment[]
  >(
    isOpen && isEditMode && entry ? ["lore-attachments", entry.id] : null,
    ([, entryId]) => getReferenceEntryAttachments(entryId as string)
  );

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
          : (entry.contentHtml ?? EMPTY_RICH_TEXT_DOC);
      editor?.commands.setContent(editorContent);
      return;
    }
    setTitle("");
    setSummary("");
    setTagsInput("");
    setAccess("PLAYER");
    editor?.commands.setContent(EMPTY_RICH_TEXT_DOC);
  }, [isOpen, isEditMode, entry, editor]);

  const submitDisabled = useMemo(
    () => submitting || uploadingAttachment || title.trim().length === 0,
    [submitting, title, uploadingAttachment]
  );

  const cleanupPending = () => {
    for (const attachment of pendingAttachments) {
      void deleteUploadedLoreFile(attachment.fileKey);
    }
    setPendingAttachments([]);
  };

  const resetForm = () => {
    setError(null);
    setTitle("");
    setSummary("");
    setTagsInput("");
    setAccess("PLAYER");
    editor?.commands.setContent(EMPTY_RICH_TEXT_DOC);
    setPendingAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (submitting || uploadingAttachment) return;
    cleanupPending();
    resetForm();
    onClose();
  };

  const addAttachmentFile = async (file: File | null) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || isPdfFileName(file.name);
    if (isPdf) {
      if (file.size > PDF_MAX_SIZE_BYTES) {
        setError(`PDF must be ${PDF_MAX_SIZE_LABEL} or smaller.`);
        return;
      }
    } else if (isImageFileName(file.name)) {
      if (file.size > IMAGE_MAX_SIZE_BYTES) {
        setError(`Image must be ${IMAGE_MAX_SIZE_LABEL} or smaller.`);
        return;
      }
    } else {
      setError("Please choose an image (PNG, JPEG, GIF, WebP) or a PDF.");
      return;
    }

    setUploadingAttachment(true);
    setError(null);
    try {
      const { fileKey, uploadUrl } = await requestLoreAttachmentUploadUrl({
        gameId,
        referenceEntryId: isEditMode && entry ? entry.id : undefined,
        fileName: file.name,
        fileSizeBytes: file.size,
      });
      await uploadLoreFileToStorage(uploadUrl, file);
      if (isEditMode && entry) {
        await createReferenceEntryAttachment(entry.id, {
          fileKey,
          fileName: file.name,
          fileSizeBytes: file.size,
        });
        await mutateAttachments();
      } else {
        setPendingAttachments((current) => [
          ...current,
          {
            fileKey,
            fileName: file.name,
            fileSizeBytes: file.size,
          },
        ]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not upload attachment."
      );
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const contentJson: JSONContent = editor?.getJSON() ?? EMPTY_RICH_TEXT_DOC;
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
        const created = await createReferenceEntry({
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
        for (const attachment of pendingAttachments) {
          await createReferenceEntryAttachment(created.id, attachment);
        }
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
        <FieldLabel id="game-lore-title" label="Title" required />
        <TextField
          id="game-lore-title"
          type="text"
          variant="dark"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. A history of the Northern Federation"
          disabled={submitting}
        />
      </div>

      <div>
        <FieldLabel id="game-lore-summary" label="Summary" />
        <TextArea
          id="game-lore-summary"
          variant="dark"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="min-h-[88px]"
          placeholder="Optional short summary"
          disabled={submitting}
          rows={3}
        />
      </div>

      <div>
        <FieldLabel id="game-lore-tags" label="Tags" />
        <TextField
          id="game-lore-tags"
          type="text"
          variant="dark"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g. history, factions, economy"
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
        <FieldLabel id="game-lore-content" label="Content" />
        <div
          id="game-lore-content"
          className="rich-text-content rounded border-2 border-white/50 bg-transparent px-3 py-2 text-white shadow-sm [&_.ProseMirror]:min-h-[11rem] [&_.ProseMirror]:text-sm [&_.ProseMirror]:outline-none [&_.ProseMirror_a]:text-white [&_.ProseMirror_a]:underline"
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

      <div>
        <FieldLabel id="game-lore-attachments" label="Attachments" />
        <p className="mb-2 text-xs text-white/70">
          Optional images (max {IMAGE_MAX_SIZE_LABEL}) or PDFs (max{" "}
          {PDF_MAX_SIZE_LABEL}) players can open or download with this lore
          entry.
        </p>
        {isEditMode && existingAttachments.length > 0 ? (
          <ul className="mb-2 space-y-1">
            {existingAttachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between gap-2 text-xs text-white/80"
              >
                <span className="truncate">{attachment.fileName}</span>
                <Button
                  type="button"
                  variant="danger"
                  className="text-xs"
                  fullWidth={false}
                  disabled={
                    submitting || deletingAttachmentId === attachment.id
                  }
                  onClick={() => {
                    if (!entry) return;
                    setDeletingAttachmentId(attachment.id);
                    void deleteReferenceEntryAttachment(entry.id, attachment.id)
                      .then(async () => {
                        await mutateAttachments();
                      })
                      .finally(() => {
                        setDeletingAttachmentId(null);
                      });
                  }}
                >
                  {deletingAttachmentId === attachment.id
                    ? "Removing…"
                    : "Remove"}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        {pendingAttachments.length > 0 ? (
          <ul className="mb-2 space-y-1">
            {pendingAttachments.map((attachment) => (
              <li
                key={attachment.fileKey}
                className="flex items-center justify-between gap-2 text-xs text-white/80"
              >
                <span className="truncate">{attachment.fileName}</span>
                <Button
                  type="button"
                  variant="danger"
                  className="text-xs"
                  fullWidth={false}
                  disabled={submitting}
                  onClick={() => {
                    void deleteUploadedLoreFile(attachment.fileKey);
                    setPendingAttachments((current) =>
                      current.filter(
                        (item) => item.fileKey !== attachment.fileKey
                      )
                    );
                  }}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <Button
          type="button"
          variant="modalFooterSecondary"
          fullWidth={false}
          disabled={submitting || uploadingAttachment}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadingAttachment ? "Uploading…" : "Add file"}
        </Button>
        <input
          ref={fileInputRef}
          id="game-lore-attachments"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf"
          disabled={submitting || uploadingAttachment}
          onChange={(event) => {
            const nextFile = event.target.files?.[0] ?? null;
            void addAttachmentFile(nextFile);
          }}
          className="sr-only"
        />
      </div>
    </GameFormModal>
  );
}
