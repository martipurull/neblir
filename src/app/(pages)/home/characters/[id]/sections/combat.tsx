"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { GameDetail } from "@/app/lib/types/game";
import { getInitiativeModifierFromCharacter } from "@/app/lib/equipCombatUtils";
import {
  getCarriedWeight,
  getEffectiveMaxCarryWeight,
  getEffectiveSpeed,
  getEquippedSpeedAlteringItems,
  getSpeedReductionTooltipText,
} from "@/app/lib/carryWeightUtils";
import Button from "@/app/components/shared/Button";
import { KeyValueRow } from "./section-shared";

interface CombatSectionOptions {
  onClearReactions: () => void;
  usedReactions: number;
  initiative: {
    gameDetails: GameDetail[];
    gamesLoading: boolean;
    onOpenRoll: () => void;
    onOpenOrder: () => void;
  };
}

export function getCombatSection(
  character: CharacterDetail,
  options: CombatSectionOptions
): CharacterSectionSlide {
  const combat = character.combatInformation;
  const inventory = character.inventory ?? undefined;
  const carriedWeight = getCarriedWeight(inventory);
  const maxCarryWeight = getEffectiveMaxCarryWeight(
    character.combatInformation?.maxCarryWeight,
    character.inventory ?? undefined
  );
  const { effectiveSpeed, showStrikethrough } = getEffectiveSpeed(
    combat.speed,
    carriedWeight,
    maxCarryWeight,
    combat.armourMod ?? 0
  );
  const speedReductionTooltip = getSpeedReductionTooltipText(
    combat.speed,
    carriedWeight,
    maxCarryWeight,
    combat.armourMod ?? 0
  );
  const speedAltering = getEquippedSpeedAlteringItems(inventory);
  const showSpeedAlteredBadge = speedAltering.displayNames.length > 0;
  const showSpeedReducedBadge =
    showStrikethrough && effectiveSpeed !== combat.speed;
  const mod = getInitiativeModifierFromCharacter(character);
  const modLabel = `${mod >= 0 ? "+" : ""}${mod}`;
  const gameLinkCount = character.games?.length ?? 0;
  const { gameDetails, gamesLoading, onOpenRoll, onOpenOrder } =
    options.initiative;
  const hasOpenInitiativeSlot = gameDetails.some(
    (g) =>
      !(g.initiativeOrder ?? []).some((e) => e.characterId === character.id)
  );
  const canRollInitiative =
    !gamesLoading && gameLinkCount > 0 && hasOpenInitiativeSlot;
  const canShowInitiativeOrder = !gamesLoading && gameLinkCount > 0;

  const rollTitle = gamesLoading
    ? "Loading games…"
    : gameLinkCount === 0
      ? "Join a game to roll initiative"
      : !hasOpenInitiativeSlot
        ? "Already rolled initiative for every game this character is in"
        : undefined;

  const orderTitle =
    gamesLoading || gameLinkCount === 0
      ? gamesLoading
        ? "Loading games…"
        : "Not in any game"
      : undefined;

  const speedValue = (
    <span className="inline-flex max-w-full flex-row flex-wrap items-center justify-end gap-x-2 gap-y-1">
      <span className="inline-flex shrink-0 flex-wrap items-baseline gap-1">
        {showStrikethrough && effectiveSpeed !== combat.speed ? (
          <>
            <span className="tabular-nums line-through text-black/60">
              {combat.speed}m
            </span>
            <span className="tabular-nums text-black">{effectiveSpeed}m</span>
          </>
        ) : (
          <span className="tabular-nums text-black">{effectiveSpeed}m</span>
        )}
      </span>
      {showSpeedReducedBadge || showSpeedAlteredBadge ? (
        <span className="inline-flex shrink-0 flex-col items-start gap-px leading-none">
          {showSpeedReducedBadge ? (
            <span
              className="cursor-help rounded bg-neblirDanger-400/12 px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neblirDanger-600"
              title={speedReductionTooltip}
            >
              Speed reduced
            </span>
          ) : null}
          {showSpeedAlteredBadge ? (
            <span
              className="cursor-help rounded text-paleBlue px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide"
              title={speedAltering.tooltip}
            >
              Speed altered
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
  const entries = [
    {
      label: "Reactions per round",
      value: String(combat.reactionsPerRound),
    },
    {
      label: "Armour modifier",
      value: `${combat.armourMod >= 0 ? "+" : ""}${combat.armourMod}`,
    },
    {
      label: "Armour HP",
      value: `${combat.armourCurrentHP}/${combat.armourMaxHP}`,
    },
  ];

  return {
    id: "combat",
    title: "Combat",
    titleSupplement: (
      <span
        className={
          options.usedReactions === 0
            ? "inline-flex cursor-help"
            : "inline-flex"
        }
        title={
          options.usedReactions === 0
            ? "No reactions to clear — this character still has all reactions available this round."
            : undefined
        }
      >
        <Button
          type="button"
          variant="semanticWarningOutline"
          fullWidth={false}
          disabled={options.usedReactions === 0}
          onClick={options.onClearReactions}
          className="!px-2 !py-1 !text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
        >
          Clear Reactions
        </Button>
      </span>
    ),
    children: (
      <ul className="divide-y divide-black">
        <li className="flex flex-col gap-2.5 py-2.5 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
            <span className="h-3 w-px bg-black" aria-hidden />
            Initiative
          </span>
          <div className="flex min-w-0 flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="semanticWarningOutline"
              fullWidth={false}
              disabled={!canRollInitiative}
              title={rollTitle}
              onClick={onOpenRoll}
              className="!px-2 !py-1 !text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
            >
              Roll Initiative ({modLabel})
            </Button>
            <Button
              type="button"
              variant="semanticSafeOutline"
              fullWidth={false}
              disabled={!canShowInitiativeOrder}
              title={orderTitle}
              onClick={onOpenOrder}
              className="!px-2 !py-1 !text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
            >
              Show Initiative Order
            </Button>
          </div>
        </li>
        <KeyValueRow
          multilineValue
          className="!items-center py-2.5 first:pt-0"
          label="Speed"
          value={speedValue}
        />
        {entries.map(({ label, value }) => (
          <KeyValueRow key={label} label={label} value={value} />
        ))}
      </ul>
    ),
  };
}
