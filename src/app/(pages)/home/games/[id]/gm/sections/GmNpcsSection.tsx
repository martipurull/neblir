import { AddCharactersToGameModal } from "@/app/components/games/AddCharactersToGameModal";
import { GmCreateNpcModal } from "@/app/components/games/GmCreateNpcModal";
import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { hasCombatantInitiativeEntry } from "@/app/lib/gmCombatantInitiative";
import { isGmControlledGameCharacter } from "@/app/lib/gmUtils";
import {
  groupNpcList,
  isArchivedNpcGroup,
  UNGROUPED_NPC_HEADING,
  viewNpcList,
  type NpcListVisibility,
} from "@/app/lib/npcList";
import { isPrivateGameCharacterLink } from "@/app/lib/roll-privacy";
import type { GameDetail } from "@/app/lib/types/game";
import { useNpcListOpenState } from "@/hooks/use-npc-list-open-state";
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
  const [visibility, setVisibility] = useState<NpcListVisibility>("all");
  const { openByKey, setSectionOpen } = useNpcListOpenState(game.id);
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

  const npcEntries = useMemo(
    () =>
      npcRows.map((gc) => {
        const char = gc.character;
        const name =
          `${char.name}${char.surname ? ` ${char.surname}` : ""}`.trim();
        return {
          id: char.id,
          name,
          npcGroup: gc.npcGroup,
          hasPlayGrant: gc.playGrant != null,
          isPublic: gc.isPublic,
          row: gc,
        };
      }),
    [npcRows]
  );

  const npcSections = useMemo(
    () => viewNpcList(npcEntries, visibility, openByKey),
    [npcEntries, visibility, openByKey]
  );

  const groupNames = useMemo(
    () =>
      groupNpcList(npcEntries)
        .filter((section) => section.heading !== UNGROUPED_NPC_HEADING)
        .map((section) => section.heading),
    [npcEntries]
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

  const runNpcTask = (
    fallback: string,
    task: () => Promise<void>,
    onDone: () => void
  ) => {
    setUpdateError(null);
    void task()
      .catch((error) => {
        setUpdateError(error instanceof Error ? error.message : fallback);
      })
      .finally(onDone);
  };

  const runCharacterUpdate = (
    characterId: string,
    action: "visibility" | "group",
    task: () => Promise<void>
  ) => {
    setBusyCharacterId(characterId);
    if (action === "visibility") setVisibilityBusyId(characterId);
    runNpcTask("Failed to update NPC.", task, () => {
      setBusyCharacterId(null);
      setVisibilityBusyId(null);
    });
  };

  const runRename = (from: string, npcGroup: string) => {
    setRenamingHeading(from);
    runNpcTask(
      "Failed to rename NPC group.",
      () => onRenameNpcGroup(from, npcGroup),
      () => setRenamingHeading(null)
    );
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

      <div className="mt-4">
        <RadioGroup
          name={`gm-npc-visibility-${game.id}`}
          label="Visibility"
          value={visibility}
          variant="chip"
          density="compact"
          options={[
            { value: "all", label: "All" },
            { value: "public", label: "Public" },
            { value: "private", label: "Private" },
          ]}
          onChange={(value) => {
            if (value === "all" || value === "public" || value === "private") {
              setVisibility(value);
            }
          }}
        />
      </div>

      <div className="mt-4 space-y-4">
        {npcRows.length === 0 ? (
          <p className="text-sm text-black/70">No NPCs yet.</p>
        ) : npcSections.length === 0 ? (
          <p className="text-sm text-black/70">No NPCs match this filter.</p>
        ) : (
          npcSections.map((section, index) => {
            const panelId = `gm-npc-section-${game.id}-${index}`;
            return (
              <section key={section.heading}>
                <GmNpcGroupHeading
                  heading={section.heading}
                  open={section.open}
                  filteredCount={section.filteredCount}
                  panelId={panelId}
                  disabled={
                    renamingHeading !== null || busyCharacterId !== null
                  }
                  onToggleOpen={() =>
                    setSectionOpen(section.storageKey, !section.open)
                  }
                  onRename={
                    section.heading === UNGROUPED_NPC_HEADING ||
                    isArchivedNpcGroup(section.heading)
                      ? undefined
                      : runRename
                  }
                />
                {section.open ? (
                  <ul id={panelId} className="mt-2 space-y-2">
                    {section.entries.map(({ row: gc }) => {
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
                ) : null}
              </section>
            );
          })
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
