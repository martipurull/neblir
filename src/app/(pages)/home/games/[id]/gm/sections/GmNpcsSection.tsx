import { AddCharactersToGameModal } from "@/app/components/games/AddCharactersToGameModal";
import { GmCreateNpcModal } from "@/app/components/games/GmCreateNpcModal";
import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { hasCombatantInitiativeEntry } from "@/app/lib/gmCombatantInitiative";
import { isGmControlledGameCharacter } from "@/app/lib/gmUtils";
import {
  groupNpcList,
  isArchivedNpcGroup,
  UNGROUPED_NPC_HEADING,
} from "@/app/lib/npcList";
import { isPrivateGameCharacterLink } from "@/app/lib/roll-privacy";
import type { GameDetail } from "@/app/lib/types/game";
import { useQueuedGmCombatantInitiative } from "@/hooks/use-queued-gm-combatant-initiative";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useCallback, useMemo, useState } from "react";
import { GmNpcCard } from "./GmNpcCard";
import { GmNpcGroupHeading } from "./GmNpcGroupHeading";
import { GmSectionTitle } from "./GmSectionTitle";

type GmNpcsSectionProps = {
  game: GameDetail;
  onSetVisibility: (characterId: string, isPublic: boolean) => Promise<void>;
  onSetNpcGroup: (
    characterId: string,
    npcGroup: string | null
  ) => Promise<void>;
  onRenameNpcGroup: (from: string, npcGroup: string) => Promise<void>;
  onCharacterRemoved: () => void | Promise<void>;
  onCharactersAdded?: () => void | Promise<void>;
  onInitiativeRolled: (game: GameDetail) => void | Promise<void>;
};

export function GmNpcsSection({
  game,
  onSetVisibility,
  onSetNpcGroup,
  onRenameNpcGroup,
  onCharacterRemoved,
  onCharactersAdded,
  onInitiativeRolled,
}: GmNpcsSectionProps) {
  const [createNpcModalOpen, setCreateNpcModalOpen] = useState(false);
  const [addNpcModalOpen, setAddNpcModalOpen] = useState(false);
  const [busyCharacterId, setBusyCharacterId] = useState<string | null>(null);
  const [renamingHeading, setRenamingHeading] = useState<string | null>(null);
  const [visibilityBusyId, setVisibilityBusyId] = useState<string | null>(null);
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

  const npcSections = useMemo(() => {
    const rowById = new Map(npcRows.map((gc) => [gc.character.id, gc]));
    return groupNpcList(
      npcRows.map((gc) => {
        const char = gc.character;
        const name =
          `${char.name}${char.surname ? ` ${char.surname}` : ""}`.trim();
        return {
          id: char.id,
          name,
          npcGroup: gc.npcGroup,
          hasPlayGrant: gc.playGrant != null,
        };
      })
    ).map((section) => ({
      heading: section.heading,
      rows: section.entries.flatMap((entry) => {
        const row = rowById.get(entry.id);
        return row ? [row] : [];
      }),
    }));
  }, [npcRows]);

  const groupNames = npcSections
    .filter((section) => section.heading !== UNGROUPED_NPC_HEADING)
    .map((section) => section.heading);

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

  const runCharacterUpdate = (
    characterId: string,
    action: "visibility" | "group",
    task: () => Promise<void>
  ) => {
    setUpdateError(null);
    setBusyCharacterId(characterId);
    if (action === "visibility") setVisibilityBusyId(characterId);
    void task()
      .catch((error) => {
        setUpdateError(
          error instanceof Error ? error.message : "Failed to update NPC."
        );
      })
      .finally(() => {
        setBusyCharacterId(null);
        setVisibilityBusyId(null);
      });
  };

  const runRename = (from: string, npcGroup: string) => {
    setUpdateError(null);
    setRenamingHeading(from);
    void onRenameNpcGroup(from, npcGroup)
      .catch((error) => {
        setUpdateError(
          error instanceof Error ? error.message : "Failed to rename NPC group."
        );
      })
      .finally(() => {
        setRenamingHeading(null);
      });
  };

  return (
    <InfoCard border>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <GmSectionTitle>NPCs</GmSectionTitle>
          <p className="mt-1 text-sm text-black/70">
            GM-controlled characters on this game, by NPC group.
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

      <div className="mt-4 space-y-4">
        {npcSections.length === 0 ? (
          <p className="text-sm text-black/70">No NPCs yet.</p>
        ) : (
          npcSections.map((section) => (
            <section key={section.heading}>
              {section.heading === UNGROUPED_NPC_HEADING ||
              isArchivedNpcGroup(section.heading) ? (
                <h3 className="text-sm font-semibold text-black">
                  {section.heading}
                </h3>
              ) : (
                <GmNpcGroupHeading
                  key={section.heading}
                  heading={section.heading}
                  disabled={
                    renamingHeading !== null || busyCharacterId !== null
                  }
                  onRename={runRename}
                />
              )}
              <ul className="mt-2 space-y-2">
                {section.rows.map((gc) => {
                  const char = gc.character;
                  const isBusy = busyCharacterId === char.id;
                  const isRolling = isPending("CHARACTER", char.id);
                  return (
                    <GmNpcCard
                      key={gc.id}
                      gameId={game.id}
                      row={gc}
                      imageUrl={npcImageUrls[char.id]}
                      isPublic={gc.isPublic !== false}
                      busy={isBusy}
                      visibilityUpdating={visibilityBusyId === char.id}
                      isRolling={isRolling}
                      hasRolled={hasCombatantInitiativeEntry(
                        game,
                        "CHARACTER",
                        char.id
                      )}
                      groupNames={groupNames}
                      onToggleVisibility={() => {
                        runCharacterUpdate(char.id, "visibility", () =>
                          onSetVisibility(char.id, gc.isPublic === false)
                        );
                      }}
                      onSetGroup={(npcGroup) => {
                        runCharacterUpdate(char.id, "group", () =>
                          onSetNpcGroup(char.id, npcGroup)
                        );
                      }}
                      onRoll={() => void handleRollNpc(gc)}
                      onRemoved={onCharacterRemoved}
                    />
                  );
                })}
              </ul>
            </section>
          ))
        )}
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
