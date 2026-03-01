"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
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
  const entries = [
    {
      label: "Initiative",
      value: `${combat.initiativeMod >= 0 ? "+" : ""}${combat.initiativeMod}`,
    },
    { label: "Speed", value: `${combat.speed} m` },
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
      <button
        type="button"
        disabled={options.usedReactions === 0}
        onClick={options.onClearReactions}
        className="rounded border border-neblirWarning-200 bg-transparent px-2 py-1 text-xs font-medium text-neblirWarning-400 transition hover:enabled:bg-neblirWarning-200/50 focus:outline-none focus-visible:enabled:ring-2 focus-visible:enabled:ring-black focus-visible:enabled:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Clear Reactions
      </button>
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
