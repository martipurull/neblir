"use client";

import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

type GmCreateNpcModalProps = {
  gameId: string;
  gameName: string;
  returnTo: string;
  onClose: () => void;
};

export function GmCreateNpcModal({
  gameId,
  gameName,
  returnTo,
  onClose,
}: GmCreateNpcModalProps) {
  const router = useRouter();
  const titleId = useId();
  const [knownToPlayers, setKnownToPlayers] = useState(false);

  const startCreate = () => {
    const params = new URLSearchParams({
      fresh: "1",
      gameId,
      returnTo,
      gameLinkIsPublic: knownToPlayers ? "1" : "0",
    });
    router.push(`/home/characters/create?${params.toString()}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-black/15 bg-paleBlue/95 p-5 shadow-lg backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-black">
          Create NPC
        </h2>
        <p className="mt-2 text-sm text-black/80">
          You are creating an NPC that will be linked to{" "}
          <span className="font-semibold text-black">{gameName}</span>. When you
          finish the character stepper, you will return to the GM screen for
          this game.
        </p>
        <div className="mt-4">
          <Checkbox
            checked={knownToPlayers}
            onChange={setKnownToPlayers}
            label="Is NPC known to players?"
          />
          <p className="mt-1 text-xs text-black/65">
            Leave unchecked to keep the NPC private to you (GM only).
          </p>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth={false}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="solidDark"
            fullWidth={false}
            onClick={startCreate}
          >
            Continue to character builder
          </Button>
        </div>
      </div>
    </div>
  );
}
