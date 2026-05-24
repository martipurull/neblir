"use client";

import { ModalShell } from "@/app/components/shared/ModalShell";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import type { SelectDropdownOption } from "@/app/components/shared/SelectDropdown";
import Link from "next/link";

export interface CharacterNameActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  gameOptions: SelectDropdownOption[];
  activeGameId: string | null;
  onActiveGameChange: (gameId: string) => void;
}

export function CharacterNameActionsModal({
  isOpen,
  onClose,
  characterId,
  gameOptions,
  activeGameId,
  onActiveGameChange,
}: CharacterNameActionsModalProps) {
  if (!isOpen) return null;

  const base =
    "block w-full rounded-md border-2 border-white/40 bg-modalBackground-200 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-modalBackground-400";

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      ariaLabel="Character actions"
      maxWidthClass="max-w-sm"
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

        <div className="mt-2 border-t border-white/20 pt-4">
          <p className="text-sm font-semibold text-white">Select active game</p>
          <p className="mt-1 text-xs text-white/75">
            Dice rolls from this character page are sent to the selected game.
          </p>
          {gameOptions.length === 0 ? (
            <p className="mt-3 text-sm text-neblirWarning-300">
              This character is not linked to a game yet.
            </p>
          ) : gameOptions.length === 1 ? (
            <p className="mt-3 text-sm text-white/85">
              Active game:{" "}
              <span className="font-medium text-white">
                {gameOptions[0].label}
              </span>
            </p>
          ) : (
            <div className="mt-3">
              <SelectDropdown
                id="character-active-game"
                label="Active game"
                placeholder="Select a game"
                value={activeGameId ?? ""}
                options={gameOptions}
                pinValueFirst={activeGameId ?? undefined}
                onChange={onActiveGameChange}
              />
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
