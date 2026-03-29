"use client";

import DangerButton from "@/app/components/shared/DangerButton";
import React, { useState } from "react";

type RemoveCharacterFromGameButtonProps = {
  gameId: string;
  characterId: string;
  onRemoved?: () => void | Promise<void>;
  className?: string;
};

export default function RemoveCharacterFromGameButton({
  gameId,
  characterId,
  onRemoved,
  className,
}: RemoveCharacterFromGameButtonProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = () => {
    void (async () => {
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
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsRemoving(false);
      }
    })();
  };

  return (
    <div className={className}>
      {error ? (
        <p className="mb-2 text-sm text-neblirDanger-600">{error}</p>
      ) : null}
      <DangerButton
        text={isRemoving ? "Removing..." : "Remove from game"}
        disabled={isRemoving}
        onClick={handleRemove}
      />
    </div>
  );
}
