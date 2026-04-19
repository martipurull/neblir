"use client";

import Button from "@/app/components/shared/Button";
import { CharacterNoteEditor } from "@/app/components/character/CharacterNoteEditor";
import {
  isNoteDocEmpty,
  parseStoredNoteToDoc,
  serializeNoteDoc,
} from "@/app/lib/tiptap/characterNote";
import type {
  CharacterDetail,
  CharacterNoteEntry,
} from "@/app/lib/types/character";
import { updateCharacterNotes } from "@/lib/api/character";
import type { JSONContent } from "@tiptap/core";
import type { KeyedMutator } from "swr";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export type CharacterNoteModalMode =
  | { type: "create" }
  | { type: "edit"; index: number };

export interface CharacterNoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  mode: CharacterNoteModalMode | null;
  notes: CharacterNoteEntry[];
  mutate: KeyedMutator<CharacterDetail | null>;
  /** Bump with the modal session so the editor remounts when opening create / another note. */
  editorSession: number;
}

export function CharacterNoteEditorModal({
  isOpen,
  onClose,
  characterId,
  mode,
  notes,
  mutate,
  editorSession,
}: CharacterNoteEditorModalProps) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">(
    "idle"
  );
  const createPhaseRef = useRef<"fresh" | "prepended">("fresh");
  /** Avoid overlapping PATCHes so a create flow cannot prepend twice. */
  const persistQueueRef = useRef(Promise.resolve());
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || mode == null) return;
    if (mode.type === "create") {
      createPhaseRef.current = "fresh";
    }
  }, [isOpen, mode, editorSession]);

  const initialDoc: JSONContent =
    mode?.type === "edit"
      ? parseStoredNoteToDoc(notes[mode.index]?.content ?? "")
      : parseStoredNoteToDoc("");

  const persistDoc = useCallback(
    (doc: JSONContent) => {
      if (!mode) return;

      const now = new Date().toISOString();
      const serialized = serializeNoteDoc(doc);
      const empty = isNoteDocEmpty(doc);

      if (
        mode.type === "create" &&
        createPhaseRef.current === "fresh" &&
        empty
      ) {
        return;
      }

      const finishDeleteAndClose = () => {
        setSaveState("saving");
        persistQueueRef.current = persistQueueRef.current
          .then(async () => {
            try {
              await mutate(
                async (prev) => {
                  if (!prev) return prev;
                  const current = prev.notes ?? [];
                  let next: CharacterNoteEntry[];
                  if (mode.type === "create") {
                    next = current.slice(1);
                    createPhaseRef.current = "fresh";
                  } else {
                    next = current.filter((_, i) => i !== mode.index);
                  }
                  return updateCharacterNotes(characterId, next);
                },
                { revalidate: false }
              );
              setSaveState("idle");
              onCloseRef.current();
            } catch {
              setSaveState("error");
            }
          })
          .catch(() => {
            setSaveState("error");
          });
      };

      if (
        mode.type === "create" &&
        createPhaseRef.current === "prepended" &&
        empty
      ) {
        finishDeleteAndClose();
        return;
      }

      if (mode.type === "edit" && empty) {
        finishDeleteAndClose();
        return;
      }

      setSaveState("saving");

      persistQueueRef.current = persistQueueRef.current
        .then(async () => {
          try {
            await mutate(
              async (prev) => {
                if (!prev) return prev;
                const current = prev.notes ?? [];
                let next: CharacterNoteEntry[];

                if (mode.type === "create") {
                  if (createPhaseRef.current === "fresh") {
                    next = [
                      {
                        content: serialized,
                        createdAt: now,
                        updatedAt: now,
                      },
                      ...current,
                    ];
                  } else {
                    next = current.map((e, i) =>
                      i === 0
                        ? { ...e, content: serialized, updatedAt: now }
                        : e
                    );
                  }
                } else {
                  next = current.map((e, i) =>
                    i === mode.index
                      ? { ...e, content: serialized, updatedAt: now }
                      : e
                  );
                }

                const updated = await updateCharacterNotes(characterId, next);
                if (
                  mode.type === "create" &&
                  createPhaseRef.current === "fresh"
                ) {
                  createPhaseRef.current = "prepended";
                }
                return updated;
              },
              { revalidate: false }
            );
            setSaveState("idle");
          } catch {
            setSaveState("error");
          }
        })
        .catch(() => {
          setSaveState("error");
        });
    },
    [characterId, mode, mutate]
  );

  const handleClose = useCallback(() => {
    setSaveState("idle");
    onClose();
  }, [onClose]);

  if (!isOpen || mode == null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-note-editor-title"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-2xl border-2 border-paleBlue/25 bg-modalBackground-200 shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-paleBlue/25 px-4 py-3">
          <h2
            id="character-note-editor-title"
            className="text-base font-semibold text-paleBlue"
          >
            {mode.type === "create" ? "New note" : "Edit note"}
          </h2>
          <Button
            type="button"
            variant="modalClosePaleBordered"
            fullWidth={false}
            onClick={handleClose}
            aria-label="Close"
          >
            ×
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-modalBackground-200 p-4">
          <CharacterNoteEditor
            key={editorSession}
            initialDoc={initialDoc}
            onDebouncedDoc={persistDoc}
          />
        </div>

        <div className="shrink-0 border-t border-paleBlue/25 bg-modalBackground-200 px-4 py-2.5">
          {saveState === "saving" && (
            <p className="text-center text-xs text-paleBlue/70">Saving…</p>
          )}
          {saveState === "error" && (
            <p className="text-center text-xs text-neblirDanger-400">
              Could not save. Try again.
            </p>
          )}
          {saveState === "idle" && (
            <p className="text-center text-xs text-paleBlue/60">
              Notes save while you type. Empty notes are not saved; clearing a
              note removes it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
