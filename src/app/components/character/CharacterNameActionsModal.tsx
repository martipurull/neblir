"use client";

import { ModalShell } from "@/app/components/shared/ModalShell";
import Link from "next/link";
export interface CharacterNameActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
}

export function CharacterNameActionsModal({
  isOpen,
  onClose,
  characterId,
}: CharacterNameActionsModalProps) {
  if (!isOpen) return null;

  const base =
    "block w-full rounded-md border-2 border-white/40 bg-modalBackground-200 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-modalBackground-400";

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      ariaLabel="Character actions"
      maxWidthClass="max-w-xs"
    >
      <div className="flex flex-col gap-2">
        <Link
          href={`/home/characters/${characterId}/update`}
          className={base}
          onClick={onClose}
        >
          Update Character
        </Link>
        <Link
          href={`/home/characters/${characterId}/level-up`}
          className={base}
          onClick={onClose}
        >
          Level Up
        </Link>
      </div>
    </ModalShell>
  );
}
