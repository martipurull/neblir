/** Shared keys for innate attribute dots and general skills (level-up, items, etc.). */

export type LevelUpAttributePath =
  | "intelligence.investigation"
  | "intelligence.memory"
  | "intelligence.deduction"
  | "wisdom.sense"
  | "wisdom.perception"
  | "wisdom.insight"
  | "personality.persuasion"
  | "personality.deception"
  | "personality.mentality"
  | "strength.athletics"
  | "strength.resilience"
  | "strength.bruteForce"
  | "dexterity.manual"
  | "dexterity.stealth"
  | "dexterity.agility"
  | "constitution.resistanceInternal"
  | "constitution.resistanceExternal"
  | "constitution.stamina";

export type LevelUpGeneralSkill =
  | "mechanics"
  | "software"
  | "generalKnowledge"
  | "history"
  | "driving"
  | "acrobatics"
  | "aim"
  | "melee"
  | "GRID"
  | "research"
  | "medicine"
  | "science"
  | "survival"
  | "streetwise"
  | "performance"
  | "manipulationNegotiation";
