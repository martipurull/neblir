import type {
  LevelUpAttributePath,
  LevelUpGeneralSkill,
} from "@/lib/api/character";
import type { LevelUpFormValues } from "./types";

export const STEPS = [
  { id: "attr", label: "Attributes" },
  { id: "health", label: "Health" },
  { id: "skill", label: "Skill" },
  { id: "path", label: "Path & Features" },
];

export const FEATURE_SLOT_INDEXES = [0, 1] as const;

export const LEVEL_UP_FORM_DEFAULTS: LevelUpFormValues = {
  hasSeriousInjuryOrTrauma: "",
  fromAttribute: "",
  toAttribute: "",
  rolledPhysicalHealth: 1,
  rolledMentalHealth: 1,
  skillImprovement: "",
  pathId: "",
  choices: [
    { mode: "none", featureId: "" },
    { mode: "none", featureId: "" },
  ],
};

export const ATTRIBUTE_OPTIONS: {
  value: LevelUpAttributePath;
  label: string;
}[] = [
  {
    value: "intelligence.investigation",
    label: "Intelligence - Investigation",
  },
  { value: "intelligence.memory", label: "Intelligence - Memory" },
  { value: "intelligence.deduction", label: "Intelligence - Deduction" },
  { value: "wisdom.sense", label: "Wisdom - Sense" },
  { value: "wisdom.perception", label: "Wisdom - Perception" },
  { value: "wisdom.insight", label: "Wisdom - Insight" },
  { value: "personality.persuasion", label: "Personality - Persuasion" },
  { value: "personality.deception", label: "Personality - Deception" },
  { value: "personality.mentality", label: "Personality - Mentality" },
  { value: "strength.athletics", label: "Strength - Athletics" },
  { value: "strength.resilience", label: "Strength - Resilience" },
  { value: "strength.bruteForce", label: "Strength - Brute Force" },
  { value: "dexterity.manual", label: "Dexterity - Manual" },
  { value: "dexterity.stealth", label: "Dexterity - Stealth" },
  { value: "dexterity.agility", label: "Dexterity - Agility" },
  {
    value: "constitution.resistanceInternal",
    label: "Constitution - Resistance (Internal)",
  },
  {
    value: "constitution.resistanceExternal",
    label: "Constitution - Resistance (External)",
  },
  { value: "constitution.stamina", label: "Constitution - Stamina" },
];

export const GENERAL_SKILL_OPTIONS: {
  value: LevelUpGeneralSkill;
  label: string;
}[] = [
  { value: "mechanics", label: "Mechanics" },
  { value: "software", label: "Software" },
  { value: "generalKnowledge", label: "General Knowledge" },
  { value: "history", label: "History" },
  { value: "driving", label: "Driving" },
  { value: "acrobatics", label: "Acrobatics" },
  { value: "aim", label: "Aim" },
  { value: "melee", label: "Melee" },
  { value: "GRID", label: "GRID" },
  { value: "research", label: "Research" },
  { value: "medicine", label: "Medicine" },
  { value: "science", label: "Science" },
  { value: "survival", label: "Survival" },
  { value: "streetwise", label: "Streetwise" },
  { value: "performance", label: "Performance" },
  {
    value: "manipulationNegotiation",
    label: "Manipulation & Negotiation",
  },
];

export const SKILL_LABEL_BY_KEY = new Map(
  GENERAL_SKILL_OPTIONS.map((option) => [option.value, option.label] as const)
);

export const ATTRIBUTE_GROUP_LABELS = {
  intelligence: "Intelligence",
  wisdom: "Wisdom",
  personality: "Personality",
  strength: "Strength",
  dexterity: "Dexterity",
  constitution: "Constitution",
} as const;
