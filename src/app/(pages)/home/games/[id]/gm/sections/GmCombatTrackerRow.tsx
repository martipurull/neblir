import {
  enemyStatusBadgeClass,
  enemyStatusLabel,
  type EnemyInstanceStatus,
} from "@/app/(pages)/home/games/[id]/gm/enemies/[enemyInstanceId]/enemyInstanceUtils";
import { Button } from "@/app/components/shared/Button";
import {
  characterHealthStatusBadgeClass,
  characterHealthStatusLabel,
  gmCombatReactionsClassName,
} from "./gmCombatDisplay";
import { GmCombatHpDisplay } from "./GmCombatHpDisplay";
import { GmCombatantAvatar } from "./GmCombatantAvatar";
import { characterSheetHref } from "./gmCombatInitiativeUtils";
import type { CombatTrackerRowProps } from "./gmCombatInitiativeTypes";
import type { Status } from "@prisma/client";
import Link from "next/link";

export function GmCombatTrackerRow({
  entry,
  index,
  gameId,
  character,
  enemy,
  imageUrl,
  initiativeActionId,
  onAdjustEntry,
  onRemoveEntry,
}: CombatTrackerRowProps) {
  const combatantRef = `${entry.combatantType}:${entry.combatantId}`;
  const displayName =
    entry.combatantType === "CHARACTER"
      ? `${entry.displayName ?? "Combatant"}${entry.displaySurname ? ` ${entry.displaySurname}` : ""}`
      : (entry.displayName ?? enemy?.name ?? "Enemy");

  const href =
    entry.combatantType === "ENEMY"
      ? `/home/games/${gameId}/gm/enemies/${entry.combatantId}`
      : character
        ? characterSheetHref(gameId, character)
        : null;

  const imageKey =
    entry.combatantType === "ENEMY"
      ? (enemy?.imageKey ?? null)
      : (character?.avatarKey ?? null);

  const enemyStatus =
    enemy != null ? (enemy.status as EnemyInstanceStatus) : null;
  const characterStatus =
    character?.healthStatus != null ? (character.healthStatus as Status) : null;

  return (
    <li className="relative flex flex-col gap-2 py-2.5 transition-colors hover:bg-black/[0.04] sm:flex-row sm:items-center sm:justify-between">
      {href ? (
        <Link
          href={href}
          className="absolute inset-0 z-0 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          aria-label={`Open ${displayName}`}
        />
      ) : null}
      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-3">
        <span className="w-6 shrink-0 text-sm font-semibold tabular-nums text-black/55">
          {index + 1}.
        </span>
        <GmCombatantAvatar
          name={displayName}
          imageKey={imageKey}
          imageUrl={imageUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="truncate text-base font-medium">{displayName}</p>
            {enemyStatus ? (
              <span className={enemyStatusBadgeClass(enemyStatus)}>
                {enemyStatusLabel(enemyStatus)}
              </span>
            ) : null}
            {characterStatus ? (
              <span
                className={characterHealthStatusBadgeClass(characterStatus)}
              >
                {characterHealthStatusLabel(characterStatus)}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            {enemy ? (
              <>
                <GmCombatHpDisplay
                  currentHealth={enemy.currentHealth}
                  maxHealth={enemy.maxHealth}
                />
                <p
                  className={gmCombatReactionsClassName(
                    enemy.reactionsRemaining
                  )}
                >
                  Reactions {enemy.reactionsRemaining}/{enemy.reactionsPerRound}
                </p>
              </>
            ) : null}
            {character ? (
              <>
                {character.currentPhysicalHealth != null &&
                character.maxPhysicalHealth != null ? (
                  <GmCombatHpDisplay
                    currentHealth={character.currentPhysicalHealth}
                    maxHealth={character.maxPhysicalHealth}
                  />
                ) : null}
                {character.reactionsPerRound != null ? (
                  <p
                    className={gmCombatReactionsClassName(
                      character.reactionsRemaining ??
                        character.reactionsPerRound
                    )}
                  >
                    Reactions{" "}
                    {character.reactionsRemaining ??
                      character.reactionsPerRound}
                    /{character.reactionsPerRound}
                  </p>
                ) : null}
              </>
            ) : null}
            <p className="text-xs tabular-nums text-black/55">
              Init {entry.totalInitiative}
            </p>
          </div>
        </div>
      </div>
      <div className="relative z-10 flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="secondaryOutlineXs"
          disabled={initiativeActionId === combatantRef}
          onClick={() => onAdjustEntry(combatantRef, -1)}
          className="!min-w-[2.25rem] !justify-center !px-2 !py-1 !text-xs"
        >
          -1
        </Button>
        <Button
          type="button"
          variant="secondaryOutlineXs"
          disabled={initiativeActionId === combatantRef}
          onClick={() => onAdjustEntry(combatantRef, +1)}
          className="!min-w-[2.25rem] !justify-center !px-2 !py-1 !text-xs"
        >
          +1
        </Button>
        <Button
          type="button"
          variant="semanticDangerOutline"
          fullWidth={false}
          disabled={initiativeActionId === combatantRef}
          onClick={() => onRemoveEntry(combatantRef)}
          className="!min-w-[7.25rem] !justify-center whitespace-nowrap !px-2 !py-1 !text-xs"
        >
          {initiativeActionId === combatantRef ? "Updating…" : "Remove"}
        </Button>
      </div>
    </li>
  );
}
