"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import {
  applyArmourPenaltyToInnateAttributeDice,
  getArmourAttributePenalty,
  MIN_INNATE_ATTRIBUTE_DICE,
} from "@/app/lib/carryWeightUtils";
import {
  ATTRIBUTE_SKILL_CAP,
  capInnateAttributeDiceWithEquipment,
  equipmentBonusTooltip,
  getEquippedItemStatBonusDetails,
} from "@/app/lib/equippedStatBonuses";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { DiceSelectionItem } from "@/app/lib/types/dice-roll";
import { isSameDiceSelection } from "@/app/lib/types/dice-roll";
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
  const equipBonuses = getEquippedItemStatBonusDetails(character);
  const attrs = character.innateAttributes;
  type AttrGroupKey = keyof typeof attrs;
  const mental: AttrGroupKey[] = (
    ["intelligence", "wisdom", "personality"] as AttrGroupKey[]
  )
    .slice()
    .sort((a, b) => a.localeCompare(b));
  const physical: AttrGroupKey[] = (
    ["strength", "dexterity", "constitution"] as AttrGroupKey[]
  )
    .slice()
    .sort((a, b) => a.localeCompare(b));
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
    attributeKeys: AttrGroupKey[]
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
          const entries = (
            Object.entries(group as Record<string, number>) as [
              string,
              number,
            ][]
          ).sort(([a], [b]) => a.localeCompare(b));
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
                  const path = `${attrKey}.${key}`;
                  const equipDetail = equipBonuses.byAttributePath.get(path);
                  const equipBonus = equipDetail?.total ?? 0;
                  const rawWithEquip = value + equipBonus;
                  const wasCapped = rawWithEquip > ATTRIBUTE_SKILL_CAP;
                  const wasFlooredAtMin =
                    rawWithEquip < MIN_INNATE_ATTRIBUTE_DICE;
                  const cappedWithEquip = capInnateAttributeDiceWithEquipment(
                    value,
                    equipBonus
                  );
                  const showArmourPenalty = armourPenaltyApplies(attrKey, key);
                  const displayValue = showArmourPenalty
                    ? applyArmourPenaltyToInnateAttributeDice(
                        cappedWithEquip,
                        armourAttrPenalty
                      )
                    : cappedWithEquip;
                  const equipTip = equipmentBonusTooltip(
                    value,
                    equipDetail,
                    wasCapped,
                    wasFlooredAtMin
                  );
                  const armourTip = showArmourPenalty
                    ? `Innate ${value} (before equipment cap), reduced by ${armourAttrPenalty} due to armour (grade ${armourMod}). Never below 1 on this scale. UI only; affects rolls.`
                    : undefined;
                  const valueTitle = [equipTip, armourTip]
                    .filter(Boolean)
                    .join(" ");
                  const showEquipStyle = equipBonus !== 0;
                  const equipPenalty = equipBonus < 0;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        data-attribute-group={attrKey}
                        data-skill={key}
                        disabled={isDisabled}
                        onClick={handleClick}
                        title={valueTitle || undefined}
                        className={`flex w-full items-center justify-between gap-4 px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset ${isDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-black/10"} ${isSelected ? "ring-2 ring-inset ring-white bg-black/10" : ""}`}
                      >
                        <span className="text-sm text-black">
                          {formatLabel(key)}
                        </span>
                        <span className="flex min-w-0 shrink-0 items-center gap-2">
                          {showArmourPenalty && (
                            <span
                              className="rounded border border-neblirDanger-400 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neblirDanger-600"
                              title={armourTip}
                            >
                              Armour penalty
                            </span>
                          )}
                          {showEquipStyle && (
                            <span
                              className={
                                equipPenalty
                                  ? "rounded border border-neblirDanger-400 bg-neblirDanger-400/15 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-neblirDanger-600"
                                  : "rounded border border-customPrimary/20 bg-paleBlue/35 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-customPrimary"
                              }
                              title={valueTitle || undefined}
                            >
                              {equipPenalty ? "reduced" : "enhanced"}
                            </span>
                          )}
                          <span
                            className={`text-sm tabular-nums ${
                              equipPenalty
                                ? "font-bold text-neblirDanger-600"
                                : showEquipStyle
                                  ? "font-bold text-paleBlue"
                                  : showArmourPenalty
                                    ? "font-medium text-neblirDanger-600"
                                    : "font-medium text-black"
                            }`}
                            title={valueTitle || undefined}
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
