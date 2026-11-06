"use client";

import { Button } from "@/app/components/shared/Button";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { createCharacterHref } from "@/app/lib/navParent";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

type GmCreateNpcModalProps = {
  gameId: string;
  gameName: string;
  returnTo: string;
  /** Shown after "you will return to". Defaults to the GM screen wording. */
  returnDestinationLabel?: string;
  /** Yes starts the game link as Public. Defaults to No (Private). */
  defaultKnownToPlayers?: boolean;
  onClose: () => void;
};

export function GmCreateNpcModal({
  gameId,
  gameName,
  returnTo,
  returnDestinationLabel = "the GM screen for this game",
  defaultKnownToPlayers = false,
  onClose,
}: GmCreateNpcModalProps) {
  const router = useRouter();
  const titleId = useId();
  const [knownToPlayers, setKnownToPlayers] = useState(defaultKnownToPlayers);

  const startCreate = () => {
    router.push(
      createCharacterHref({
        fresh: true,
        gameId,
        returnTo,
        gameLinkIsPublic: knownToPlayers,
      })
    );
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
        className="theme-modal w-full max-w-md rounded-lg border border-black/15 bg-paleBlue/95 p-5 shadow-lg backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-black">
          Create NPC
        </h2>
        <p className="mt-2 text-sm text-black/80">
          You are creating an NPC that will be linked to{" "}
          <span className="font-semibold text-black">{gameName}</span>. When you
          finish the character stepper, you will return to{" "}
          {returnDestinationLabel}.
        </p>
        <div className="mt-4">
          <RadioGroup
            name="npc-known-to-players"
            label="Is NPC known to players?"
            value={knownToPlayers ? "yes" : "no"}
            variant="chip"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            onChange={(value) => setKnownToPlayers(value === "yes")}
          />
          <p className="mt-2 text-xs text-black/65">
            Yes lets other players see this NPC. No keeps it private, and the
            owner, the GM, and a play-grant grantee still see it.
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
