// eslint-disable-next-line no-unused-expressions
"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import {
  getCarriedWeight,
  getEffectiveMaxCarryWeight,
  getEffectiveSpeed,
} from "@/app/lib/carryWeightUtils";
import { WarningButton } from "@/app/components/shared/SemanticActionButton";
import React from "react";
import { KeyValueRow } from "./section-shared";

interface CombatSectionOptions {
  onClearReactions: () => void;
  /** Number of reactions used this round; button is disabled when 0 */
  usedReactions: number;
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
  const speedValue =
    showStrikethrough && effectiveSpeed !== combat.speed ? (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-baseline gap-1.5">
          <span className="tabular-nums line-through text-black/60">
            {combat.speed} m
          </span>
          <span className="tabular-nums text-black">{effectiveSpeed} m</span>
        </span>
        <span className="rounded border border-neblirDanger-400 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neblirDanger-600">
          Speed reduced
        </span>
      </span>
    ) : (
      `${effectiveSpeed} m`
    );
  const entries = [
    {
      label: "Initiative",
      value: `${combat.initiativeMod >= 0 ? "+" : ""}${combat.initiativeMod}`,
    },
    { label: "Speed", value: speedValue },
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
      <WarningButton
        type="button"
        disabled={options.usedReactions === 0}
        onClick={options.onClearReactions}
        className="!px-2 !py-1 !text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1"
      >
        Clear Reactions
      </WarningButton>
    ),
    children: (
      <ul className="divide-y divide-black">
        {entries.map(({ label, value }) => (
          <KeyValueRow key={label} label={label} value={value} />
        ))}
      </ul>
    ),
  };
}
