"use client";

import { ModalShell } from "@/app/components/shared/ModalShell";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import type { SelectDropdownOption } from "@/app/components/shared/SelectDropdown";
import { Button } from "@/app/components/shared/Button";
import {
  appButtonVariantClassName,
  linkAsModalActionBlockClassName,
} from "@/app/components/shared/buttonStyles";
import {
  getDeleteCharacterConfirmationPhrase,
  TypeToConfirmDangerModal,
} from "@/app/components/shared/TypeToConfirmDangerModal";
import { deleteCharacter } from "@/lib/api/character";
import { setGameCharacterVisibility } from "@/lib/api/game";
import { updateUserCharacterLayoutMode } from "@/lib/api/user";
import type { CharacterLayoutMode } from "@/app/lib/types/user";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useUser } from "@/hooks/use-user";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export type CharacterGameLinkForActions = {
  gameId: string;
  isPublic?: boolean;
};

export interface CharacterNameActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
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
  characterName,
  gameOptions,
  gameLinks,
  activeGameId,
  onActiveGameChange,
  onVisibilityUpdated,
}: CharacterNameActionsModalProps) {
  const router = useRouter();
  const { user, refetch: refetchUser } = useUser();
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] =
    useState<CharacterLayoutMode>("horizontal");
  const [localIsPublicByGameId, setLocalIsPublicByGameId] = useState<
    Record<string, boolean>
  >({});
  const confirmationPhrase =
    getDeleteCharacterConfirmationPhrase(characterName);

  useEffect(() => {
    if (!isOpen) return;
    const next: Record<string, boolean> = {};
    for (const link of gameLinks) {
      next[link.gameId] = link.isPublic ?? true;
    }
    setLocalIsPublicByGameId(next);
    setVisibilityError(null);
  }, [isOpen, gameLinks]);

  useEffect(() => {
    if (!isOpen) return;
    setLayoutMode(user?.characterLayoutMode ?? "horizontal");
    setLayoutError(null);
  }, [isOpen, user?.characterLayoutMode]);

  const activeIsPublic = useMemo(() => {
    if (!activeGameId) return true;
    if (activeGameId in localIsPublicByGameId) {
      return localIsPublicByGameId[activeGameId];
    }
    const link = gameLinks.find((g) => g.gameId === activeGameId);
    return link?.isPublic ?? true;
  }, [activeGameId, gameLinks, localIsPublicByGameId]);

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }
    setDeleteError(null);
    setDeleteModalOpen(false);
  };

  const openDeleteModal = () => {
    setDeleteError(null);
    onClose();
    setDeleteModalOpen(true);
  };

  const handleDeleteCharacter = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteCharacter(characterId);
      router.push("/home/characters");
    } catch (error) {
      setDeleteError(
        getUserSafeErrorMessage(error, "Failed to delete character")
      );
    } finally {
      setIsDeleting(false);
    }
  };

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

  const handleLayoutChange = (value: string) => {
    if (!user || layoutSaving) return;
    if (value !== "horizontal" && value !== "vertical") return;
    const nextMode = value as CharacterLayoutMode;
    const currentMode = user.characterLayoutMode ?? "horizontal";
    if (nextMode === currentMode) return;

    setLayoutMode(nextMode);
    setLayoutSaving(true);
    setLayoutError(null);
    void (async () => {
      try {
        await updateUserCharacterLayoutMode(user.id, nextMode);
        await refetchUser();
      } catch (e) {
        setLayoutMode(currentMode);
        setLayoutError(
          getUserSafeErrorMessage(e, "Failed to update character layout.")
        );
      } finally {
        setLayoutSaving(false);
      }
    })();
  };

  if (!isOpen && !deleteModalOpen) return null;

  const actionBlockLinkClass = `${linkAsModalActionBlockClassName} ${appButtonVariantClassName.modalActionBlock}`;

  const showVisibilityToggle =
    activeGameId != null && gameLinks.some((g) => g.gameId === activeGameId);

  return (
    <>
      {isOpen ? (
        <ModalShell
          isOpen
          onClose={onClose}
          ariaLabel="Character actions"
          maxWidthClass="max-w-sm"
        >
          <div className="flex flex-col gap-2">
            <Link
              href={`/home/characters/${characterId}/update`}
              className={actionBlockLinkClass}
              onClick={onClose}
            >
              Update Character
            </Link>
            <Link
              href={`/home/characters/${characterId}/level-up`}
              className={actionBlockLinkClass}
              onClick={onClose}
            >
              Level Up
            </Link>

            <div className="mt-2 border-t border-white/20 pt-4">
              <p className="text-sm font-semibold text-white">
                Select active game
              </p>
              <p className="mt-1 text-xs text-white/75">
                Dice rolls from this character page are sent to the selected
                game.
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
                  <Button
                    type="button"
                    variant="modalActionBlock"
                    disabled={visibilityBusy}
                    onClick={handleToggleVisibility}
                    className="mt-3"
                  >
                    {visibilityBusy
                      ? "Updating..."
                      : activeIsPublic
                        ? "Make private"
                        : "Make public"}
                  </Button>
                  {visibilityError ? (
                    <p className="mt-2 text-sm text-neblirDanger-400">
                      {visibilityError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-2 border-t border-white/20 pt-4">
              <p className="text-sm font-semibold text-white">
                Character page layout
              </p>
              <p className="mt-1 text-xs text-white/75">
                Choose between horizontal carousel and vertical scrolling cards.
              </p>
              <div className="mt-3">
                <RadioGroup
                  name="character-layout-mode-modal"
                  value={layoutMode}
                  options={[
                    { value: "horizontal", label: "Horizontal" },
                    { value: "vertical", label: "Vertical" },
                  ]}
                  onChange={handleLayoutChange}
                  disabled={layoutSaving}
                  tone="inverse"
                  variant="chip"
                />
              </div>
              {layoutError ? (
                <p className="mt-2 text-sm text-neblirDanger-400">
                  {layoutError}
                </p>
              ) : null}
            </div>

            <div className="mt-2 border-t border-white/20 pt-4">
              <p className="text-sm font-semibold text-white">Danger zone</p>
              <p className="mt-1 text-xs text-white/75">
                Permanently delete this character. This removes inventory,
                notes, game links, and all other character data. This cannot be
                undone.
              </p>
              <Button
                type="button"
                variant="danger"
                fullWidth={false}
                onClick={openDeleteModal}
                className="mt-3"
              >
                Delete character
              </Button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      <TypeToConfirmDangerModal
        isOpen={deleteModalOpen}
        variant="modalBackground"
        title="Delete character?"
        description={
          <>
            You are about to permanently delete <strong>{characterName}</strong>
            . This character will be removed from every linked game along with
            their inventory, notes, and related data.
          </>
        }
        requiredPhrase={confirmationPhrase}
        confirmLabel="Delete character"
        confirmSubmittingLabel="Deleting character..."
        isSubmitting={isDeleting}
        errorMessage={deleteError}
        onCancel={closeDeleteModal}
        onConfirm={handleDeleteCharacter}
      />
    </>
  );
}
