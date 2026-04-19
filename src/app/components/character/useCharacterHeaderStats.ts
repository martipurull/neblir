import type { CharacterDetail } from "@/app/lib/types/character";
import {
  getArmourDisplayFromInventory,
  getAttackModifierArrays,
  getEquippedBrainGridBonusesDisplay,
  getEffectiveCombatMods,
  getGridAttackModifierOptions,
  getGridAttackRollData,
  getGridDefenceDice,
} from "@/app/lib/equipCombatUtils";
import { useMemo } from "react";

const SOFTWARE_WARRIOR_FEATURE_NAME = "Software Warrior";

export function useCharacterHeaderStats(character: CharacterDetail) {
  const { generalInformation, health, combatInformation } = character;

  const name = `${generalInformation.name}${generalInformation.surname ? ` ${generalInformation.surname}` : ""}`;
  const pathsLabel =
    character.paths && character.paths.length > 0
      ? character.paths.map((p) => String(p.name)).join(" / ")
      : "No path";

  const armourDisplay = useMemo(
    () =>
      getArmourDisplayFromInventory(
        character.inventory ?? undefined,
        combatInformation.armourCurrentHP
      ),
    [character.inventory, combatInformation.armourCurrentHP]
  );

  const effectiveMods = useMemo(
    () => getEffectiveCombatMods(character),
    [character]
  );
  const attackModArrays = useMemo(
    () => getAttackModifierArrays(character),
    [character]
  );

  const gridAttackOptions = useMemo(
    () => getGridAttackModifierOptions(character),
    [character]
  );
  const gridRollData = useMemo(
    () => getGridAttackRollData(character),
    [character]
  );

  const softwareWarriorFeature = useMemo(
    () =>
      character.features?.find(
        (f) => f.feature.name === SOFTWARE_WARRIOR_FEATURE_NAME
      ) ?? null,
    [character.features]
  );
  const hasSoftwareWarrior = softwareWarriorFeature != null;
  const showGridAttack = gridRollData.gridMod > 0 || hasSoftwareWarrior;
  const gridAttackDisplayMod = useMemo(
    () => Math.max(0, gridRollData.gridAttackDice),
    [gridRollData.gridAttackDice]
  );

  const gridDefenceDice = useMemo(
    () => getGridDefenceDice(character),
    [character]
  );

  const gridModCellValue = useMemo(() => {
    const bonuses = getEquippedBrainGridBonusesDisplay(character);
    if (bonuses.gridAttackBonus === 0 && bonuses.gridDefenceBonus === 0) {
      return "—";
    }
    const fmtPart = (n: number) => (n >= 0 ? `+${n}` : String(n));
    const cellPart = (n: number) => (n === 0 ? "—" : fmtPart(n));
    return `${cellPart(bonuses.gridAttackBonus)} / ${cellPart(bonuses.gridDefenceBonus)}`;
  }, [character]);

  const gridBonuses = useMemo(
    () => getEquippedBrainGridBonusesDisplay(character),
    [character]
  );

  const formatSigned = (n: number) => (n >= 0 ? `+${n}` : String(n));

  const gridAttackModifierHint = useMemo(() => {
    const parts = [
      `Mentality ${formatSigned(character.innateAttributes.personality.mentality)}`,
      `GRID ${formatSigned(character.learnedSkills.generalSkills.GRID)}`,
    ];
    if (gridBonuses.gridAttackBonus > 0) {
      parts.push(
        `GRID Attack Patch ${formatSigned(gridBonuses.gridAttackBonus)}`
      );
    }
    return `Modifier = ${parts.join(" + ")}`;
  }, [
    character.innateAttributes.personality.mentality,
    character.learnedSkills.generalSkills.GRID,
    gridBonuses.gridAttackBonus,
  ]);

  const gridAttackDamageHint = useMemo(() => {
    const lines: string[] = [];
    if (gridRollData.gridPatchDamageHint) {
      lines.push(gridRollData.gridPatchDamageHint);
    }
    const g = softwareWarriorFeature?.grade ?? 0;
    if (g >= 4) lines.push("Software Warrior: +2d6 damage");
    else if (g >= 1) lines.push("Software Warrior: +1d6 damage");
    return lines.length > 0 ? lines.join("\n") : undefined;
  }, [gridRollData.gridPatchDamageHint, softwareWarriorFeature]);

  const gridDefenceModifierHint = useMemo(() => {
    const parts = [
      `Mentality ${formatSigned(character.innateAttributes.personality.mentality)}`,
      `GRID ${formatSigned(character.learnedSkills.generalSkills.GRID)}`,
    ];
    if (gridBonuses.gridDefenceBonus > 0) {
      parts.push(
        `GRID Defence Patch ${formatSigned(gridBonuses.gridDefenceBonus)}`
      );
    }
    return `Modifier = ${parts.join(" + ")}`;
  }, [
    character.innateAttributes.personality.mentality,
    character.learnedSkills.generalSkills.GRID,
    gridBonuses.gridDefenceBonus,
  ]);

  return {
    generalInformation,
    health,
    combatInformation,
    name,
    pathsLabel,
    armourDisplay,
    effectiveMods,
    attackModArrays,
    gridAttackOptions,
    showGridAttack,
    gridAttackDisplayMod,
    gridDefenceDice,
    gridModCellValue,
    gridAttackModifierHint,
    gridAttackDamageHint,
    gridDefenceModifierHint,
  };
}
