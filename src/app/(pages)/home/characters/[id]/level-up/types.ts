import type {
  LevelUpAttributePath,
  LevelUpGeneralSkill,
} from "@/lib/api/character";

export type PathOption = {
  id: string;
  name: string;
  description: string | null;
  baseFeature: string;
};

export type FeatureOption = {
  id: string;
  name: string;
  maxGrade: number;
  minPathRank: number;
  description?: string | null;
};

export type FeatureChoiceMode = "none" | "new" | "increment";

export type FeatureChoice = { mode: FeatureChoiceMode; featureId: string };

export type LevelUpFormValues = {
  hasSeriousInjuryOrTrauma: "yes" | "no" | "";
  fromAttribute: LevelUpAttributePath | "";
  toAttribute: LevelUpAttributePath | "";
  rolledPhysicalHealth: number;
  rolledMentalHealth: number;
  skillImprovement: LevelUpGeneralSkill | "";
  pathId: string;
  choices: [FeatureChoice, FeatureChoice];
};
