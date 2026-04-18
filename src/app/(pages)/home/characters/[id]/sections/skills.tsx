"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import Button from "@/app/components/shared/Button";
import {
  ATTRIBUTE_SKILL_CAP,
  capAttributeOrSkill,
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

export function getSkillsSection(
  character: CharacterDetail,
  diceSelection?: DiceSelectionItem[],
  onDiceSelect?: (item: DiceSelectionItem) => void
): CharacterSectionSlide {
  const equipBonuses = getEquippedItemStatBonusDetails(character);
  const skills = character.learnedSkills;
  const generalSkillsEntries =
    skills.generalSkills &&
    (Object.entries(skills.generalSkills) as [string, number][]).sort(
      ([a], [b]) => a.localeCompare(b)
    );

  const selection = diceSelection ?? [];
  const hasTwo = selection.length === 2;
  const firstIsSkill = selection[0]?.type === "skill";
  const skillsDisabledWhenOneSkill = selection.length === 1 && firstIsSkill;

  return {
    id: "skills",
    title: "Skills",
    children: (
      <div className="space-y-8">
        <div className="space-y-3">
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
            <span className="h-3 w-px bg-black" aria-hidden />
            General Skills
          </span>
          {generalSkillsEntries ? (
            <ul className="divide-y divide-black rounded border border-black">
              {generalSkillsEntries.map(([skillKey, value]) => {
                const item: DiceSelectionItem = {
                  type: "skill",
                  skillKey,
                };
                const isSelected = selection.some((s) =>
                  isSameDiceSelection(s, item)
                );
                const isDisabled =
                  (hasTwo && !isSelected) ||
                  (skillsDisabledWhenOneSkill && !isSelected);
                const handleClick = () => {
                  if (onDiceSelect) onDiceSelect(item);
                };
                const equipDetail = equipBonuses.bySkill.get(skillKey);
                const equipBonus = equipDetail?.total ?? 0;
                const rawWithEquip = value + equipBonus;
                const wasCapped = rawWithEquip > ATTRIBUTE_SKILL_CAP;
                const displayValue = capAttributeOrSkill(value, equipBonus);
                const showEquipStyle = equipBonus !== 0;
                const equipPenalty = equipBonus < 0;
                const valueTitle = equipmentBonusTooltip(
                  value,
                  equipDetail,
                  wasCapped
                );
                return (
                  <li key={skillKey}>
                    <Button
                      type="button"
                      variant="lightSkillDiceRow"
                      fullWidth={false}
                      className={`w-full transition ${isDisabled ? "cursor-not-allowed opacity-50" : "hover:bg-black/10"} ${isSelected ? "ring-2 ring-inset ring-white bg-black/10" : ""}`}
                      data-skill-type="general"
                      data-skill={skillKey}
                      disabled={isDisabled}
                      onClick={handleClick}
                      title={valueTitle ?? undefined}
                    >
                      <span className="text-sm text-black">
                        {formatLabel(skillKey)}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {showEquipStyle && (
                          <span
                            className={
                              equipPenalty
                                ? "rounded border border-neblirDanger-400 bg-neblirDanger-400/15 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-neblirDanger-600"
                                : "rounded border border-customPrimary/20 bg-paleBlue/35 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-customPrimary"
                            }
                            title={valueTitle ?? undefined}
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
                                : "font-medium text-black"
                          }`}
                          title={valueTitle ?? undefined}
                        >
                          {displayValue}
                        </span>
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-black">No general skills.</p>
          )}
          {skills.specialSkills && skills.specialSkills.length > 0 && (
            <div className="space-y-3">
              <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
                <span className="h-3 w-px bg-black" aria-hidden />
                Special Skills
              </span>
              <ul className="divide-y divide-black rounded border border-black">
                {skills.specialSkills
                  .map((name, storageIndex) => ({ name, storageIndex }))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(({ name, storageIndex }) => (
                    <li key={storageIndex}>
                      <Button
                        type="button"
                        variant="lightSpecialSkillRow"
                        fullWidth={false}
                        className="w-full"
                        data-skill-type="special"
                        data-skill-index={storageIndex}
                        data-skill-name={name}
                      >
                        {name}
                      </Button>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    ),
  };
}
