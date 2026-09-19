import { AddCharactersToGameModal } from "@/app/components/games/AddCharactersToGameModal";
import { GmCreateNpcModal } from "@/app/components/games/GmCreateNpcModal";
import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { hasCombatantInitiativeEntry } from "@/app/lib/gmCombatantInitiative";
import {
  isGmControlledGameCharacter,
  sortGrantedNpcsFirst,
} from "@/app/lib/gmUtils";
import { isPrivateGameCharacterLink } from "@/app/lib/roll-privacy";
import type { GameDetail } from "@/app/lib/types/game";
import { useQueuedGmCombatantInitiative } from "@/hooks/use-queued-gm-combatant-initiative";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useCallback, useMemo, useState } from "react";
import { GmNpcCard } from "./GmNpcCard";
import { GmSectionTitle } from "./GmSectionTitle";

type GmNpcsSectionProps = {
  game: GameDetail;
  onSetVisibility: (characterId: string, isPublic: boolean) => Promise<void>;
  onCharacterRemoved: () => void | Promise<void>;
  onCharactersAdded?: () => void | Promise<void>;
  onInitiativeRolled: (game: GameDetail) => void | Promise<void>;
};

export function GmNpcsSection({
  game,
  onSetVisibility,
  onCharacterRemoved,
  onCharactersAdded,
  onInitiativeRolled,
}: GmNpcsSectionProps) {
  const [createNpcModalOpen, setCreateNpcModalOpen] = useState(false);
  const [addNpcModalOpen, setAddNpcModalOpen] = useState(false);
  const [updatingCharacterId, setUpdatingCharacterId] = useState<string | null>(
    null
  );
  const [updateError, setUpdateError] = useState<string | null>(null);
  const {
    isPending,
    enqueueRoll,
    error: rollError,
  } = useQueuedGmCombatantInitiative({
    game,
    onRolled: onInitiativeRolled,
  });
  const gmReturnTo = `/home/games/${game.id}/gm`;

  const npcRows = useMemo(
    () =>
      (game.characters ?? []).filter((gc) =>
        isGmControlledGameCharacter(gc, game)
      ),
    [game]
  );

  const alreadyLinkedCharacterIds = useMemo(
    () => (game.characters ?? []).map((gc) => gc.character.id),
    [game.characters]
  );

  const publicNpcs = sortGrantedNpcsFirst(
    npcRows.filter((gc) => gc.isPublic ?? true)
  );
  const privateNpcs = sortGrantedNpcsFirst(
    npcRows.filter((gc) => !(gc.isPublic ?? true))
  );
  const npcImageUrls = useImageUrls(
    npcRows.map((gc) => ({
      id: gc.character.id,
      imageKey: gc.character.avatarKey ?? null,
    }))
  );

  const handleRollNpc = useCallback(
    async (gc: (typeof npcRows)[number]) => {
      const char = gc.character;
      const name =
        `${char.name}${char.surname ? ` ${char.surname}` : ""}`.trim();
      await enqueueRoll({
        combatantType: "CHARACTER",
        combatantId: char.id,
        combatantName: name,
        initiativeModifier: char.initiativeMod ?? 0,
        isPrivate: isPrivateGameCharacterLink(gc.isPublic),
        source: "gmNpcCard",
      });
    },
    [enqueueRoll]
  );

  const renderNpcList = (
    rows: typeof npcRows,
    emptyText: string,
    visibility: "Public" | "Private"
  ) => {
    if (rows.length === 0) {
      return <p className="text-sm text-black/70">{emptyText}</p>;
    }
    return (
      <ul className="space-y-2">
        {rows.map((gc) => {
          const char = gc.character;
          const isUpdating = updatingCharacterId === char.id;
          const isRolling = isPending("CHARACTER", char.id);
          const targetVisibility = visibility === "Public" ? false : true;
          return (
            <GmNpcCard
              key={gc.id}
              gameId={game.id}
              row={gc}
              imageUrl={npcImageUrls[char.id]}
              isPublic={visibility === "Public"}
              isUpdating={isUpdating}
              isRolling={isRolling}
              hasRolled={hasCombatantInitiativeEntry(
                game,
                "CHARACTER",
                char.id
              )}
              onToggleVisibility={() => {
                setUpdateError(null);
                setUpdatingCharacterId(char.id);
                void onSetVisibility(char.id, targetVisibility)
                  .catch((error) => {
                    setUpdateError(
                      error instanceof Error
                        ? error.message
                        : "Failed to update visibility."
                    );
                  })
                  .finally(() => {
                    setUpdatingCharacterId(null);
                  });
              }}
              onRoll={() => void handleRollNpc(gc)}
              onRemoved={onCharacterRemoved}
            />
          );
        })}
      </ul>
    );
  };

  return (
    <InfoCard border>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <GmSectionTitle>NPCs</GmSectionTitle>
          <p className="mt-1 text-sm text-black/70">
            NPCs linked to this game, grouped by player visibility.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 max-sm:w-full">
          <Button
            type="button"
            variant="solidDark"
            fullWidth={false}
            className="text-sm max-sm:flex-1"
            onClick={() => setAddNpcModalOpen(true)}
          >
            Add NPC
          </Button>
          <Button
            type="button"
            variant="solidDark"
            fullWidth={false}
            className="text-sm max-sm:flex-1"
            onClick={() => setCreateNpcModalOpen(true)}
          >
            Create NPC
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold text-black">
            Public to players
          </h3>
          <div className="mt-2">
            {renderNpcList(publicNpcs, "No public NPCs yet.", "Public")}
          </div>
        </section>
        <section>
          <h3 className="text-sm font-semibold text-black">Private to GM</h3>
          <div className="mt-2">
            {renderNpcList(privateNpcs, "No private NPCs yet.", "Private")}
          </div>
        </section>
      </div>
      {updateError ? (
        <p className="mt-3 text-sm text-neblirDanger-400">{updateError}</p>
      ) : null}
      {rollError ? (
        <p className="mt-3 text-sm text-neblirDanger-400">{rollError}</p>
      ) : null}
      <AddCharactersToGameModal
        isOpen={addNpcModalOpen}
        gameId={game.id}
        gameName={game.name}
        alreadyLinkedCharacterIds={alreadyLinkedCharacterIds}
        title={`Add NPCs to ${game.name}`}
        subtitle="Select one or more of your existing characters to link as NPCs for this game."
        searchPlaceholder="Search your characters..."
        emptySelectableMessage="All of your characters are already linked to this game."
        defaultIsPublic={false}
        visibilityCheckboxLabel="Known to players"
        onClose={() => setAddNpcModalOpen(false)}
        onSuccess={() => {
          void onCharactersAdded?.();
        }}
      />
      {createNpcModalOpen ? (
        <GmCreateNpcModal
          gameId={game.id}
          gameName={game.name}
          returnTo={gmReturnTo}
          onClose={() => setCreateNpcModalOpen(false)}
        />
      ) : null}
    </InfoCard>
  );
}
