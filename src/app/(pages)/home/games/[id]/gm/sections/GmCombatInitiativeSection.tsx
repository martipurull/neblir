"use client";

import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useMemo } from "react";
import { GmCombatTrackerRow } from "./GmCombatTrackerRow";
import { GmSectionTitle } from "./GmSectionTitle";
import type { GmCombatInitiativeSectionProps } from "./gmCombatInitiativeTypes";
import {
  buildCharacterById,
  buildEnemyById,
  buildInitiativeImageEntries,
} from "./gmCombatInitiativeUtils";

export function GmCombatInitiativeSection({
  game,
  initiativeOrder,
  hasInitiativeEntries,
  clearingInitiative,
  resettingReactions,
  initiativeActionId,
  onClearAll,
  onResetReactions,
  onRemoveEntry,
  onAdjustEntry,
  onOpenRollModal,
}: GmCombatInitiativeSectionProps) {
  const characterById = useMemo(
    () => buildCharacterById(game.characters),
    [game.characters]
  );
  const enemyById = useMemo(
    () => buildEnemyById(game.enemyInstances),
    [game.enemyInstances]
  );

  const imageEntries = useMemo(
    () =>
      buildInitiativeImageEntries(initiativeOrder, characterById, enemyById),
    [initiativeOrder, characterById, enemyById]
  );

  const imageUrls = useImageUrls(imageEntries);

  return (
    <InfoCard border>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <GmSectionTitle>Combat / Initiative</GmSectionTitle>
          <p className="mt-1 text-xs text-black/70">
            Initiative order with HP and status. Click a combatant to open their
            sheet or enemy instance.
          </p>
        </div>
        {hasInitiativeEntries && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondaryOutlineXs"
              fullWidth={false}
              disabled={clearingInitiative || resettingReactions}
              onClick={onResetReactions}
              className="!px-3 !py-1.5 !text-xs"
            >
              {resettingReactions ? "Resetting…" : "Reset reactions"}
            </Button>
            <Button
              type="button"
              variant="danger"
              fullWidth={false}
              disabled={clearingInitiative || resettingReactions}
              onClick={onClearAll}
              className="!px-3 !py-1.5 !text-xs"
            >
              {clearingInitiative ? "Clearing…" : "Clear initiative"}
            </Button>
          </div>
        )}
      </div>

      {!hasInitiativeEntries ? (
        <p className="mt-4 text-sm text-black/70">
          Ask players to roll for initiative or roll initiative for one of the
          GM-controlled characters (NPCs / creatures).
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-black/15 border-b border-black/15 text-sm text-black">
          {initiativeOrder.map((entry, index) => (
            <GmCombatTrackerRow
              key={`${entry.combatantType}:${entry.combatantId}-${index}`}
              entry={entry}
              index={index}
              gameId={game.id}
              character={
                entry.combatantType === "CHARACTER"
                  ? characterById.get(entry.combatantId)
                  : undefined
              }
              enemy={
                entry.combatantType === "ENEMY"
                  ? enemyById.get(entry.combatantId)
                  : undefined
              }
              imageUrl={imageUrls[entry.combatantId]}
              initiativeActionId={initiativeActionId}
              onAdjustEntry={onAdjustEntry}
              onRemoveEntry={onRemoveEntry}
            />
          ))}
        </ul>
      )}

      <div className="mt-6">
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onOpenRollModal}
        >
          Roll initiative
        </Button>
      </div>
    </InfoCard>
  );
}
