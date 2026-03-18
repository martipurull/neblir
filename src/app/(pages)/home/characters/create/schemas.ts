import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import type { Race, Religion } from "@prisma/client";

/** Default values for character creation form (matches API schema). */
export function getDefaultCharacterCreationFormValues(): CharacterCreationRequest {
  const level = 1;
  return {
    generalInformation: {
      name: "",
      surname: "",
      age: 25,
      religion: "ATHEIST" as Religion,
      profession: "",
      race: "HUMAN" as Race,
      birthplace: "",
      level,
      height: 170,
      weight: 70,
    },
    health: {
      rolledPhysicalHealth: 10,
      rolledMentalHealth: 10,
      seriousPhysicalInjuries: 0,
      seriousTrauma: 0,
      status: "ALIVE",
    },
    combatInformation: {
      armourMod: 0,
      armourMaxHP: 0,
      armourCurrentHP: 0,
      GridMod: 0,
      throwAttackMod: 0,
    },
    innateAttributes: {
      intelligence: { investigation: 1, memory: 1, deduction: 1 },
      wisdom: { sense: 1, perception: 1, insight: 1 },
      personality: { persuasion: 1, deception: 1, mentality: 1 },
      strength: { athletics: 1, resilience: 1, bruteForce: 1 },
      dexterity: { manual: 1, stealth: 1, agility: 1 },
      constitution: {
        resistanceInternal: 1,
        resistanceExternal: 1,
        stamina: 1,
      },
    },
    learnedSkills: {
      generalSkills: {
        mechanics: 0,
        software: 0,
        generalKnowledge: 0,
        history: 0,
        driving: 0,
        acrobatics: 0,
        aim: 0,
        melee: 0,
        GRID: 0,
        research: 0,
        medicine: 0,
        science: 0,
        survival: 0,
        streetwise: 0,
        performance: 0,
        manipulationNegotiation: 0,
      },
      // Keep stable string entries so step validation doesn't fail with undefineds.
      specialSkills: ["", "", ""],
    },
    path: { pathId: "", rank: level },
    wallet: [],
  };
}

export const RACES: { value: Race; label: string }[] = [
  { value: "KINIAN", label: "Kinian" },
  { value: "FENNE", label: "Fenne" },
  { value: "HUMAN", label: "Human" },
  { value: "MANFENN", label: "Manfenn" },
];

export const RELIGIONS: { value: Religion; label: string }[] = [
  { value: "TRITHEOLOGY", label: "Tritheology" },
  { value: "PANTRITHEOLOGY", label: "Pantritheology" },
  { value: "CHRISLAM", label: "Chrislam" },
  { value: "HUMANISM", label: "Humanism" },
  { value: "CHOSEN_FAITH", label: "Chosen Faith" },
  { value: "FORE_CAST", label: "Fore Cast" },
  { value: "ATHEIST", label: "Atheist" },
  { value: "AGNOSTIC", label: "Agnostic" },
];

export const CURRENCY_NAMES = ["CONF", "NORD", "NAS", "HUMF", "MRARK"] as const;

/** Race bonus: which attributes get +1 (starting at 2). */
export const RACE_ATTRIBUTE_BONUSES: Record<
  Race,
  { group: keyof CharacterCreationRequest["innateAttributes"]; key: string }[]
> = {
  KINIAN: [
    { group: "wisdom", key: "perception" },
    { group: "strength", key: "bruteForce" },
  ],
  FENNE: [
    { group: "dexterity", key: "manual" },
    { group: "intelligence", key: "investigation" },
  ],
  HUMAN: [
    { group: "strength", key: "resilience" },
    { group: "wisdom", key: "insight" },
  ],
  MANFENN: [
    { group: "strength", key: "resilience" },
    { group: "dexterity", key: "manual" },
  ],
};
