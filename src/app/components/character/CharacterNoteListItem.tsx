// eslint-disable-next-line no-unused-expressions
"use client";

import { CharacterNoteHtml } from "@/app/components/character/CharacterNoteHtml";
import DangerConfirmModal from "@/app/components/shared/DangerConfirmModal";
import { DangerButton as DangerOutlineButton } from "@/app/components/shared/SemanticActionButton";
import { formatNoteTimestamp } from "@/app/lib/characterNotes";
import type { CharacterNoteEntry } from "@/app/lib/types/character";
import React, { useCallback, useState } from "react";

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export interface CharacterNoteListItemProps {
  entry: CharacterNoteEntry;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void | Promise<void>;
}

export function CharacterNoteListItem({
  entry,
  index,
  onEdit,
  onDelete,
}: CharacterNoteListItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await Promise.resolve(onDelete(index));
      setConfirmOpen(false);
    } catch {
      // Keep dialog open; list data unchanged on failure.
    } finally {
      setDeleting(false);
    }
  }, [index, onDelete]);

  return (
    <li className="border-b border-black last:border-b-0">
      <div className="flex items-start gap-2 py-2 pl-3 pr-2">
        <button
          type="button"
          className="min-w-0 flex-1 flex-col rounded-sm px-1 py-1 text-left -ml-1 transition-colors hover:bg-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          onClick={() => onEdit(index)}
        >
          <div className="max-h-32 min-h-0 overflow-hidden">
            <CharacterNoteHtml content={entry.content} />
          </div>
          <div className="mt-2 w-full text-right text-[10px] leading-tight text-black/45">
            <div>Created {formatNoteTimestamp(entry.createdAt)}</div>
            <div>Edited {formatNoteTimestamp(entry.updatedAt)}</div>
          </div>
        </button>

        <div className="shrink-0 self-start pt-1">
          <DangerOutlineButton
            type="button"
            aria-label={`Delete note ${index + 1}`}
            onClick={() => setConfirmOpen(true)}
            className="!flex !h-8 !w-8 !min-w-0 items-center justify-center !rounded-md !p-0"
          >
            <TrashIcon className="shrink-0" />
          </DangerOutlineButton>
        </div>
      </div>

      <DangerConfirmModal
        isOpen={confirmOpen}
        title="Delete note?"
        description="This cannot be undone."
        confirmLabel="Confirm Delete Note"
        cancelLabel="Cancel"
        isSubmitting={deleting}
        variant="modalBackground"
        panelClassName="max-w-xs"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </li>
  );
}
