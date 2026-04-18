"use client";

import {
  CharacterNoteEditorModal,
  type CharacterNoteModalMode,
} from "@/app/components/character/CharacterNoteEditorModal";
import Button from "@/app/components/shared/Button";
import { CharacterNoteListItem } from "@/app/components/character/CharacterNoteListItem";
import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import { updateCharacterNotes } from "@/lib/api/character";
import type { KeyedMutator } from "swr";
import React, { useCallback, useState } from "react";

function CharacterNotesSectionContent({
  character,
  mutate,
}: {
  character: CharacterDetail;
  mutate: KeyedMutator<CharacterDetail | null>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<CharacterNoteModalMode | null>(null);
  const [editorSession, setEditorSession] = useState(0);
  const notes = character.notes ?? [];

  const openCreate = () => {
    setMode({ type: "create" });
    setEditorSession((s) => s + 1);
    setModalOpen(true);
  };

  const openEdit = (index: number) => {
    setMode({ type: "edit", index });
    setEditorSession((s) => s + 1);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setMode(null);
  };

  const deleteNoteAt = useCallback(
    async (index: number) => {
      try {
        await mutate(
          async (prev) => {
            if (!prev) return prev;
            const next = (prev.notes ?? []).filter((_, i) => i !== index);
            return updateCharacterNotes(character.id, next);
          },
          { revalidate: false }
        );
      } catch {
        // SWR leaves prior data; optional toast could go here
      }
    },
    [character.id, mutate]
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="lightSquareIcon"
            fullWidth={false}
            onClick={openCreate}
            aria-label="Add note"
          >
            +
          </Button>
        </div>

        {notes.length === 0 ? (
          <p className="text-sm text-black/55">
            No notes yet. Tap + to jot something down.
          </p>
        ) : (
          <ul className="overflow-hidden rounded border border-black">
            {notes.map((entry, index) => (
              <CharacterNoteListItem
                key={`${entry.updatedAt}-${index}`}
                entry={entry}
                index={index}
                onEdit={openEdit}
                onDelete={deleteNoteAt}
              />
            ))}
          </ul>
        )}
      </div>

      <CharacterNoteEditorModal
        isOpen={modalOpen}
        onClose={closeModal}
        characterId={character.id}
        mode={modalOpen ? mode : null}
        notes={notes}
        mutate={mutate}
        editorSession={editorSession}
      />
    </>
  );
}

export function getNotesSection(
  character: CharacterDetail,
  mutate: KeyedMutator<CharacterDetail | null>
): CharacterSectionSlide {
  return {
    id: "notes",
    title: "Notes",
    children: (
      <CharacterNotesSectionContent character={character} mutate={mutate} />
    ),
  };
}
