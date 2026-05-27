"use client";

import { ModalShell } from "@/app/components/shared/ModalShell";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import type { SelectDropdownOption } from "@/app/components/shared/SelectDropdown";
import { setGameCharacterVisibility } from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type CharacterGameLinkForActions = {
  gameId: string;
  isPublic?: boolean;
};

export interface CharacterNameActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  gameOptions: SelectDropdownOption[];
  gameLinks: CharacterGameLinkForActions[];
  activeGameId: string | null;
  onActiveGameChange: (gameId: string) => void;
  onVisibilityUpdated?: () => void | Promise<void>;
}

export function CharacterNameActionsModal({
  isOpen,
  onClose,
  characterId,
  gameOptions,
  gameLinks,
  activeGameId,
  onActiveGameChange,
  onVisibilityUpdated,
}: CharacterNameActionsModalProps) {
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [localIsPublicByGameId, setLocalIsPublicByGameId] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!isOpen) return;
    const next: Record<string, boolean> = {};
    for (const link of gameLinks) {
      next[link.gameId] = link.isPublic ?? true;
    }
    setLocalIsPublicByGameId(next);
    setVisibilityError(null);
  }, [isOpen, gameLinks]);

  const activeIsPublic = useMemo(() => {
    if (!activeGameId) return true;
    if (activeGameId in localIsPublicByGameId) {
      return localIsPublicByGameId[activeGameId];
    }
    const link = gameLinks.find((g) => g.gameId === activeGameId);
    return link?.isPublic ?? true;
  }, [activeGameId, gameLinks, localIsPublicByGameId]);

  const handleToggleVisibility = () => {
    if (!activeGameId || visibilityBusy) return;
    void (async () => {
      setVisibilityBusy(true);
      setVisibilityError(null);
      const nextIsPublic = !activeIsPublic;
      try {
        await setGameCharacterVisibility(
          activeGameId,
          characterId,
          nextIsPublic
        );
        setLocalIsPublicByGameId((prev) => ({
          ...prev,
          [activeGameId]: nextIsPublic,
        }));
        await onVisibilityUpdated?.();
      } catch (e) {
        setVisibilityError(
          getUserSafeErrorMessage(e, "Failed to update visibility.")
        );
      } finally {
        setVisibilityBusy(false);
      }
    })();
  };

  if (!isOpen) return null;

  const base =
    "block w-full rounded-md border-2 border-white/40 bg-modalBackground-200 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-modalBackground-400 disabled:cursor-not-allowed disabled:opacity-60";

  const showVisibilityToggle =
    activeGameId != null && gameLinks.some((g) => g.gameId === activeGameId);

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

          {showVisibilityToggle ? (
            <div className="mt-4 border-t border-white/20 pt-4">
              <p className="text-sm font-semibold text-white">
                Visibility in game
              </p>
              <p className="mt-1 text-xs text-white/75">
                {activeIsPublic
                  ? "Other players in this game can see this character in lists and known NPCs."
                  : "Only you and the game master see this character in the game."}
              </p>
              <button
                type="button"
                className={`${base} mt-3`}
                disabled={visibilityBusy}
                onClick={handleToggleVisibility}
              >
                {visibilityBusy
                  ? "Updating..."
                  : activeIsPublic
                    ? "Make private"
                    : "Make public"}
              </button>
              {visibilityError ? (
                <p className="mt-2 text-sm text-neblirDanger-400">
                  {visibilityError}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </ModalShell>
  );
}
