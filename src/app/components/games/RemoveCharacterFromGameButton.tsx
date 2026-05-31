"use client";

import { Button } from "@/app/components/shared/Button";
import { DangerConfirmModal } from "@/app/components/shared/DangerConfirmModal";
import { useState } from "react";

type RemoveCharacterFromGameButtonProps = {
  gameId: string;
  characterId: string;
  /** Shown in the confirmation dialog when provided. */
  characterName?: string;
  onRemoved?: () => void | Promise<void>;
  /** Wrapper classes (e.g. spacing); `w-fit` is always applied. */
  className?: string;
};

export function RemoveCharacterFromGameButton({
  gameId,
  characterId,
  characterName,
  onRemoved,
  className,
}: RemoveCharacterFromGameButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeRemove = async () => {
    setError(null);
    setIsRemoving(true);
    try {
      const res = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/characters`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId }),
        }
      );
      if (!res.ok) {
        let msg = "Failed to remove character from game";
        try {
          const payload = (await res.json()) as {
            message?: string;
            details?: string;
          };
          msg = payload.details ?? payload.message ?? msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      await onRemoved?.();
      setConfirmOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsRemoving(false);
    }
  };

  const closeConfirm = () => {
    if (isRemoving) return;
    setConfirmOpen(false);
    setError(null);
  };

  const wrapperClass = ["w-fit max-w-full", className]
    .filter(Boolean)
    .join(" ");
  const subject = characterName?.trim() ?? "This character";

  return (
    <>
      <div className={wrapperClass}>
        {error && !confirmOpen ? (
          <p className="mb-2 text-sm text-neblirDanger-600">{error}</p>
        ) : null}
        <Button
          variant="danger"
          fullWidth={false}
          disabled={isRemoving}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setError(null);
            setConfirmOpen(true);
          }}
        >
          Remove from game
        </Button>
      </div>
      <DangerConfirmModal
        isOpen={confirmOpen}
        title="Remove character from game?"
        description={
          <>
            Unlink <span className="font-semibold">{subject}</span> from this
            game? They will no longer appear in this game&apos;s character
            lists. The character sheet is not deleted.
          </>
        }
        confirmLabel="Remove from game"
        confirmSubmittingLabel="Removing..."
        isSubmitting={isRemoving}
        errorMessage={error}
        onCancel={closeConfirm}
        onConfirm={executeRemove}
      />
    </>
  );
}
