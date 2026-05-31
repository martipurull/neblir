"use client";

import { Button } from "@/app/components/shared/Button";
import { DangerConfirmModal } from "@/app/components/shared/DangerConfirmModal";
import { useState } from "react";

type RemovePlayerFromGameButtonProps = {
  gameId: string;
  userId: string;
  userName: string;
  onRemoved?: () => void | Promise<void>;
  /** Wrapper classes (e.g. spacing); `w-fit` is always applied. */
  className?: string;
};

export function RemovePlayerFromGameButton({
  gameId,
  userId,
  userName,
  onRemoved,
  className,
}: RemovePlayerFromGameButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeRemove = async () => {
    setError(null);
    setIsRemoving(true);
    try {
      const res = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/users/${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        let msg = "Failed to remove player from game";
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
        title="Remove player from game?"
        description={
          <>
            Remove <span className="font-semibold">{userName}</span> from this
            game? All of their characters will be unlinked from the game and
            their roll history for this game will be cleared. Character sheets
            are not deleted.
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
