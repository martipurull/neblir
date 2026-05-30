import type { z } from "zod";
import type { UseFormSetError } from "react-hook-form";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { characterCreationRequestSchema } from "@/app/api/characters/schemas";

const CHARACTER_CREATION_STEP_COUNT = 6;

export type CharacterCreationInitialFeature = {
  featureId: string;
  grade: number;
};

export type CharacterCreationValidationContext = {
  initialFeatures?: CharacterCreationInitialFeature[];
};

export function getCharacterFeatureSlots(level: number): number {
  return Math.max(0, 2 * (level - 1));
}

export function isCharacterFeatureSelectionValid(
  level: number,
  initialFeatures: CharacterCreationInitialFeature[] = []
): boolean {
  const featureSlots = getCharacterFeatureSlots(level);
  const selectedFeatureGradeSum = initialFeatures.reduce(
    (sum, entry) => sum + entry.grade,
    0
  );
  return selectedFeatureGradeSum <= featureSlots;
}

function setZodErrors(
  setError: UseFormSetError<CharacterCreationRequest>,
  error: z.ZodError,
  prefix?: string
) {
  for (const issue of error.issues) {
    const path = prefix
      ? [prefix, ...issue.path.map(String)].join(".")
      : (issue.path.join(".") as keyof CharacterCreationRequest & string);
    if (path) setError(path as never, { message: issue.message });
  }
}

function applyCharacterFeatureSelectionValidationError(
  level: number,
  initialFeatures: CharacterCreationInitialFeature[],
  setError: UseFormSetError<CharacterCreationRequest>
): boolean {
  if (isCharacterFeatureSelectionValid(level, initialFeatures)) return true;

  const featureSlots = getCharacterFeatureSlots(level);
  setError("path.pathId" as never, {
    message: `Selected feature grades exceed available slots (${featureSlots}). Remove feature grades before continuing.`,
  });
  return false;
}

export function applyCharacterCreationStepValidationErrors(
  stepIndex: number,
  values: CharacterCreationRequest,
  setError: UseFormSetError<CharacterCreationRequest>,
  context?: CharacterCreationValidationContext
): boolean {
  if (stepIndex === 0) return true;

  if (stepIndex === 1) {
    const generalRes =
      characterCreationRequestSchema.shape.generalInformation.safeParse(
        values.generalInformation
      );
    if (!generalRes.success) {
      setZodErrors(setError, generalRes.error);
      return false;
    }

    const walletRes = characterCreationRequestSchema.shape.wallet.safeParse(
      values.wallet
    );
    if (!walletRes.success) {
      setZodErrors(setError, walletRes.error);
      return false;
    }
    return true;
  }

  if (stepIndex === 2) {
    const attrRes =
      characterCreationRequestSchema.shape.innateAttributes.safeParse(
        values.innateAttributes
      );
    if (!attrRes.success) {
      setZodErrors(setError, attrRes.error);
      return false;
    }

    const groups = Object.values(values.innateAttributes ?? {});
    const attrSum = groups.reduce((acc, g) => {
      const groupSum = Object.values(g as Record<string, number>).reduce(
        (a, v) => a + v,
        0
      );
      return acc + groupSum;
    }, 0);
    if (attrSum > 36) {
      setError("innateAttributes" as never, {
        message: "Innate attributes sum cannot exceed 36.",
      });
      return false;
    }
    return true;
  }

  if (stepIndex === 3) {
    const level = values.generalInformation?.level ?? 1;
    const healthRes = characterCreationRequestSchema.shape.health.safeParse(
      values.health
    );
    if (!healthRes.success) {
      setZodErrors(setError, healthRes.error);
      return false;
    }

    const maxRolled = 10 * level;
    const minRolled = 10 + Math.max(0, level - 1);
    const rolledPhysical = values.health?.rolledPhysicalHealth ?? 10;
    const rolledMental = values.health?.rolledMentalHealth ?? 10;

    if (rolledPhysical < minRolled || rolledPhysical > maxRolled) {
      setError("health.rolledPhysicalHealth" as never, {
        message: `Physical rolled HP must be between ${minRolled} and ${maxRolled} for level ${level}.`,
      });
      return false;
    }

    if (rolledMental < minRolled || rolledMental > maxRolled) {
      setError("health.rolledMentalHealth" as never, {
        message: `Mental rolled HP must be between ${minRolled} and ${maxRolled} for level ${level}.`,
      });
      return false;
    }
    return true;
  }

  if (stepIndex === 4) {
    const skillsRes =
      characterCreationRequestSchema.shape.learnedSkills.safeParse(
        values.learnedSkills
      );
    if (!skillsRes.success) {
      setZodErrors(setError, skillsRes.error);
      return false;
    }

    const level = values.generalInformation?.level ?? 1;
    const filledSpecial =
      values.learnedSkills?.specialSkills?.filter((s) => s?.trim()).length ?? 0;
    const learnedSkillsMax = 13 + level + (3 - filledSpecial);
    const skillSum = Object.values(
      values.learnedSkills?.generalSkills ?? {}
    ).reduce((acc, v) => acc + (v === 5 ? 6 : v), 0);
    if (skillSum > learnedSkillsMax) {
      setError("learnedSkills.generalSkills" as never, {
        message: `Learned skills exceed maximum (${learnedSkillsMax}).`,
      });
      return false;
    }
    return true;
  }

  if (stepIndex === 5) {
    const pathRes = characterCreationRequestSchema.shape.path.safeParse(
      values.path
    );
    if (!pathRes.success) {
      setZodErrors(setError, pathRes.error, "path");
      return false;
    }
    const level = values.generalInformation?.level ?? 1;
    return applyCharacterFeatureSelectionValidationError(
      level,
      context?.initialFeatures ?? [],
      setError
    );
  }

  return true;
}

export function isCharacterCreationStepValid(
  stepIndex: number,
  values: CharacterCreationRequest,
  context?: CharacterCreationValidationContext
): boolean {
  if (stepIndex === 0) return true;

  if (stepIndex === 1) {
    const generalRes =
      characterCreationRequestSchema.shape.generalInformation.safeParse(
        values.generalInformation
      );
    if (!generalRes.success) return false;

    const walletRes = characterCreationRequestSchema.shape.wallet.safeParse(
      values.wallet
    );
    return walletRes.success;
  }

  if (stepIndex === 2) {
    const attrRes =
      characterCreationRequestSchema.shape.innateAttributes.safeParse(
        values.innateAttributes
      );
    if (!attrRes.success) return false;

    const groups = Object.values(values.innateAttributes ?? {});
    const attrSum = groups.reduce((acc, g) => {
      const groupSum = Object.values(g as Record<string, number>).reduce(
        (a, v) => a + v,
        0
      );
      return acc + groupSum;
    }, 0);
    return attrSum <= 36;
  }

  if (stepIndex === 3) {
    const healthRes = characterCreationRequestSchema.shape.health.safeParse(
      values.health
    );
    if (!healthRes.success) return false;

    const level = values.generalInformation?.level ?? 1;
    const maxRolled = 10 * level;
    const minRolled = 10 + Math.max(0, level - 1);
    const rolledPhysical = values.health?.rolledPhysicalHealth ?? 10;
    const rolledMental = values.health?.rolledMentalHealth ?? 10;
    return (
      rolledPhysical >= minRolled &&
      rolledPhysical <= maxRolled &&
      rolledMental >= minRolled &&
      rolledMental <= maxRolled
    );
  }

  if (stepIndex === 4) {
    const skillsRes =
      characterCreationRequestSchema.shape.learnedSkills.safeParse(
        values.learnedSkills
      );
    if (!skillsRes.success) return false;

    const level = values.generalInformation?.level ?? 1;
    const filledSpecial =
      values.learnedSkills?.specialSkills?.filter((s) => s?.trim()).length ?? 0;
    const learnedSkillsMax = 13 + level + (3 - filledSpecial);
    const skillSum = Object.values(
      values.learnedSkills?.generalSkills ?? {}
    ).reduce((acc, v) => acc + (v === 5 ? 6 : v), 0);
    return skillSum <= learnedSkillsMax;
  }

  if (stepIndex === 5) {
    const pathRes = characterCreationRequestSchema.shape.path.safeParse(
      values.path
    );
    if (!pathRes.success) return false;
    const level = values.generalInformation?.level ?? 1;
    return isCharacterFeatureSelectionValid(
      level,
      context?.initialFeatures ?? []
    );
  }

  return true;
}

export function getFirstInvalidCharacterCreationStep(
  values: CharacterCreationRequest,
  context?: CharacterCreationValidationContext
): number | null {
  for (
    let stepIndex = 0;
    stepIndex < CHARACTER_CREATION_STEP_COUNT;
    stepIndex++
  ) {
    if (!isCharacterCreationStepValid(stepIndex, values, context)) {
      return stepIndex;
    }
  }
  return null;
}

export function isCharacterCreationFormSubmittable(
  values: CharacterCreationRequest,
  context?: CharacterCreationValidationContext
): boolean {
  return getFirstInvalidCharacterCreationStep(values, context) === null;
}
