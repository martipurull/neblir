/** Shared keys for innate attribute dots and general skills (level-up, items, etc.). */

export const LEVEL_UP_ATTRIBUTE_PATHS = [
  "intelligence.investigation",
  "intelligence.memory",
  "intelligence.deduction",
  "wisdom.sense",
  "wisdom.perception",
  "wisdom.insight",
  "personality.persuasion",
  "personality.deception",
  "personality.mentality",
  "strength.athletics",
  "strength.resilience",
  "strength.bruteForce",
  "dexterity.manual",
  "dexterity.stealth",
  "dexterity.agility",
  "constitution.resistanceInternal",
  "constitution.resistanceExternal",
  "constitution.stamina",
] as const;

export type LevelUpAttributePath = (typeof LEVEL_UP_ATTRIBUTE_PATHS)[number];

export const LEVEL_UP_GENERAL_SKILLS = [
  "mechanics",
  "software",
  "generalKnowledge",
  "history",
  "driving",
  "acrobatics",
  "aim",
  "melee",
  "GRID",
  "research",
  "medicine",
  "science",
  "survival",
  "streetwise",
  "performance",
  "manipulationNegotiation",
] as const;

export type LevelUpGeneralSkill = (typeof LEVEL_UP_GENERAL_SKILLS)[number];
