"use client";

import {
  enemyStatusBadgeClass,
  enemyStatusLabel,
  type EnemyInstanceStatus,
} from "@/app/(pages)/home/games/[id]/gm/enemies/[enemyInstanceId]/enemyInstanceUtils";
import { Button } from "@/app/components/shared/Button";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import type { GameDetail } from "@/app/lib/types/game";
import { useImageUrls } from "@/hooks/use-image-urls";
import type { Status } from "@prisma/client";
import Link from "next/link";
import { useMemo } from "react";
import {
  characterHealthStatusBadgeClass,
  characterHealthStatusLabel,
  gmCombatReactionsClassName,
} from "./gmCombatDisplay";
import { GmCombatHpDisplay } from "./GmCombatHpDisplay";
import { GmSectionTitle } from "./GmSectionTitle";

type InitiativeEntry = NonNullable<GameDetail["initiativeOrder"]>[number];
type GameCharacterRow = NonNullable<GameDetail["characters"]>[number];
type EnemyInstanceRow = NonNullable<GameDetail["enemyInstances"]>[number];

type GmInitiativeSectionProps = {
  game: GameDetail;
  initiativeOrder: NonNullable<GameDetail["initiativeOrder"]>;
  hasInitiativeEntries: boolean;
  clearingInitiative: boolean;
  initiativeActionId: string | null;
  onClearAll: () => void;
  onRemoveEntry: (combatantRef: string) => void;
  onAdjustEntry: (combatantRef: string, initiativeDelta: number) => void;
  onOpenRollModal: () => void;
};

function characterSheetHref(
  gameId: string,
  character: GameCharacterRow["character"]
): string {
  if (character.isOwnedByCurrentUser) {
    return `/home/characters/${character.id}?returnTo=${encodeURIComponent(`/home/games/${gameId}/gm`)}`;
  }
  return `/home/games/${gameId}/characters/${character.id}`;
}

function CombatantAvatar({
  name,
  imageKey,
  imageUrl,
}: {
  name: string;
  imageKey?: string | null;
  imageUrl: string | null | undefined;
}) {
  return (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-paleBlue/20">
      {imageUrl ? (
        <SignedRemoteImage
          src={imageUrl}
          imageKey={imageKey ?? undefined}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 object-cover object-top"
        />
      ) : imageUrl === undefined ? (
        <ImageLoadingSkeleton
          variant="avatar"
          className="h-full w-full [&_svg]:h-11 [&_svg]:w-11"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-black">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function GmCombatInitiativeSection({
  game,
  initiativeOrder,
  hasInitiativeEntries,
  clearingInitiative,
  initiativeActionId,
  onClearAll,
  onRemoveEntry,
  onAdjustEntry,
  onOpenRollModal,
}: GmInitiativeSectionProps) {
  const characterById = useMemo(() => {
    const map = new Map<string, GameCharacterRow["character"]>();
    for (const gc of game.characters ?? []) {
      map.set(gc.character.id, gc.character);
    }
    return map;
  }, [game.characters]);

  const enemyById = useMemo(() => {
    const map = new Map<string, EnemyInstanceRow>();
    for (const enemy of game.enemyInstances ?? []) {
      map.set(enemy.id, enemy);
    }
    return map;
  }, [game.enemyInstances]);

  const imageEntries = useMemo(() => {
    return initiativeOrder.flatMap((entry) => {
      if (entry.combatantType === "CHARACTER") {
        const character = characterById.get(entry.combatantId);
        if (!character) return [];
        return [
          {
            id: character.id,
            imageKey: character.avatarKey ?? null,
          },
        ];
      }
      const enemy = enemyById.get(entry.combatantId);
      if (!enemy) return [];
      return [{ id: enemy.id, imageKey: enemy.imageKey ?? null }];
    });
  }, [initiativeOrder, characterById, enemyById]);

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
          <Button
            type="button"
            variant="danger"
            fullWidth={false}
            disabled={clearingInitiative}
            onClick={onClearAll}
            className="!px-3 !py-1.5 !text-xs"
          >
            {clearingInitiative ? "Clearing…" : "Clear initiative"}
          </Button>
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
            <CombatTrackerRow
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

type CombatTrackerRowProps = {
  entry: InitiativeEntry;
  index: number;
  gameId: string;
  character?: GameCharacterRow["character"];
  enemy?: EnemyInstanceRow;
  imageUrl: string | null | undefined;
  initiativeActionId: string | null;
  onAdjustEntry: (combatantRef: string, initiativeDelta: number) => void;
  onRemoveEntry: (combatantRef: string) => void;
};

function CombatTrackerRow({
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
        <CombatantAvatar
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
