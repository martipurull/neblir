"use client";

import {
  getDeleteGameConfirmationPhrase,
  TypeToConfirmDangerModal,
} from "@/app/components/shared/TypeToConfirmDangerModal";
import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { deleteGame } from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GmSectionTitle } from "./GmSectionTitle";

type GmDangerZoneSectionProps = {
  gameId: string;
  gameName: string;
};

export function GmDangerZoneSection({
  gameId,
  gameName,
}: GmDangerZoneSectionProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const confirmationPhrase = getDeleteGameConfirmationPhrase(gameName);

  const closeModal = () => {
    if (isDeleting) {
      return;
    }
    setErrorMessage(null);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await deleteGame(gameId);
      router.push("/home/games");
    } catch (error) {
      setErrorMessage(getUserSafeErrorMessage(error, "Failed to delete game"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <InfoCard className="!mt-0 border-neblirDanger-400">
        <GmSectionTitle>Danger zone</GmSectionTitle>
        <p className="mt-1 text-sm text-black/70">
          Permanently delete this game. This removes all player links, character
          links, custom items, enemies, initiative, Discord integration, and
          other game data. This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="danger"
            fullWidth={false}
            onClick={() => {
              setErrorMessage(null);
              setModalOpen(true);
            }}
          >
            Delete Game
          </Button>
        </div>
      </InfoCard>

      <TypeToConfirmDangerModal
        isOpen={modalOpen}
        title="Delete game?"
        description={
          <>
            You are about to permanently delete <strong>{gameName}</strong>. All
            linked characters, custom content, and related data for this game
            will be removed.
          </>
        }
        requiredPhrase={confirmationPhrase}
        confirmLabel="Delete game"
        confirmSubmittingLabel="Deleting game..."
        isSubmitting={isDeleting}
        errorMessage={errorMessage}
        onCancel={closeModal}
        onConfirm={handleDelete}
      />
    </>
  );
}
