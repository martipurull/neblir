// eslint-disable-next-line no-unused-expressions
"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { DiceSelectionItem } from "@/app/lib/types/dice-roll";
import { isSameDiceSelection } from "@/app/lib/types/dice-roll";
import { getArmourAttributePenalty } from "@/app/lib/carryWeightUtils";
import React from "react";

function formatLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getAttributesSection(
  character: CharacterDetail,
  diceSelection?: DiceSelectionItem[],
  onDiceSelect?: (item: DiceSelectionItem) => void
): CharacterSectionSlide {
  const attrs = character.innateAttributes;
  const mental: (keyof typeof attrs)[] = [
    "intelligence",
    "wisdom",
    "personality",
  ];
  const physical: (keyof typeof attrs)[] = [
    "strength",
    "dexterity",
    "constitution",
  ];
  const armourMod = character.combatInformation?.armourMod ?? 0;
  const armourAttrPenalty = getArmourAttributePenalty(armourMod);
  const armourPenaltyApplies = (attrKey: string, skillKey: string) =>
    attrKey === "dexterity" &&
    (skillKey === "agility" || skillKey === "stealth") &&
    armourAttrPenalty > 0;

  const selection = diceSelection ?? [];
  const hasTwo = selection.length === 2;

  const renderAttributeGroup = (
    groupLabel: string,
    attributeKeys: (keyof typeof attrs)[]
  ) => (
    <div key={groupLabel} className="space-y-4">
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
        <span className="h-3 w-px bg-black" aria-hidden />
        {groupLabel}
      </span>
      <div className="space-y-4">
        {attributeKeys.map((attrKey) => {
          const group = attrs[attrKey];
          if (typeof group !== "object" || group === null) return null;
          const entries = Object.entries(group as Record<string, number>) as [
            string,
            number,
          ][];
          return (
            <div key={attrKey} className="space-y-1.5">
              <span className="text-xs font-medium text-black">
                {formatLabel(attrKey)}
              </span>
              <ul className="divide-y divide-black rounded border border-black">
                {entries.map(([key, value]) => {
                  const item: DiceSelectionItem = {
                    type: "attribute",
                    attributeGroup: attrKey,
                    skillKey: key,
                  };
                  const isSelected = selection.some((s) =>
                    isSameDiceSelection(s, item)
                  );
                  const isDisabled = hasTwo && !isSelected;
                  const handleClick = () => {
                    if (onDiceSelect) onDiceSelect(item);
                  };
                  const showArmourPenalty = armourPenaltyApplies(attrKey, key);
                  const displayValue = showArmourPenalty
                    ? value - armourAttrPenalty
                    : value;
                  const valueTitle = showArmourPenalty
                    ? `Base ${value}, reduced by ${armourAttrPenalty} due to armour (grade ${armourMod}). UI only; affects rolls.`
                    : undefined;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        data-attribute-group={attrKey}
                        data-skill={key}
                        disabled={isDisabled}
                        onClick={handleClick}
                        title={valueTitle}
                        className={`flex w-full items-center justify-between gap-4 px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset ${isDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-black/10"} ${isSelected ? "ring-2 ring-inset ring-white bg-black/10" : ""}`}
                      >
                        <span className="text-sm text-black">
                          {formatLabel(key)}
                        </span>
                        <span className="flex min-w-0 shrink-0 items-center gap-2">
                          {showArmourPenalty && (
                            <span
                              className="rounded border border-neblirDanger-400 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neblirDanger-600"
                              title={valueTitle}
                            >
                              Armour penalty
                            </span>
                          )}
                          <span
                            className={`text-sm font-medium tabular-nums ${showArmourPenalty ? "text-neblirDanger-600" : "text-black"}`}
                          >
                            {displayValue}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );

  return {
    id: "attributes",
    title: "Attributes",
    children: (
      <div className="space-y-8">
        {renderAttributeGroup("Mental Attributes", mental)}
        {renderAttributeGroup("Physical Attributes", physical)}
      </div>
    ),
  };
}
