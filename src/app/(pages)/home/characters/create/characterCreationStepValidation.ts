import type { z } from "zod";
import type { UseFormSetError } from "react-hook-form";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { characterCreationRequestSchema } from "@/app/api/characters/schemas";

export const CHARACTER_CREATION_STEP_COUNT = 6;

function setZodErrors(
  setError: UseFormSetError<CharacterCreationRequest>,
  error: z.ZodError
) {
  for (const issue of error.issues) {
    const path = issue.path.join(".") as keyof CharacterCreationRequest &
      string;
    if (path) setError(path as never, { message: issue.message });
  }
}

export function applyCharacterCreationStepValidationErrors(
  stepIndex: number,
  values: CharacterCreationRequest,
  setError: UseFormSetError<CharacterCreationRequest>
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
        message: `Physical HP looks too low for level ${level}. Please roll physical HP (min ${minRolled}, max ${maxRolled}).`,
      });
      return false;
    }

    if (rolledMental < minRolled || rolledMental > maxRolled) {
      setError("health.rolledMentalHealth" as never, {
        message: `Mental HP looks too low for level ${level}. Please roll mental HP (min ${minRolled}, max ${maxRolled}).`,
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
      setZodErrors(setError, pathRes.error);
      return false;
    }
    return true;
  }

  return true;
}

export function isCharacterCreationStepValid(
  stepIndex: number,
  values: CharacterCreationRequest
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
    return pathRes.success;
  }

  return true;
}

export function getFirstInvalidCharacterCreationStep(
  values: CharacterCreationRequest
): number | null {
  for (
    let stepIndex = 0;
    stepIndex < CHARACTER_CREATION_STEP_COUNT;
    stepIndex++
  ) {
    if (!isCharacterCreationStepValid(stepIndex, values)) {
      return stepIndex;
    }
  }
  return null;
}

export function isCharacterCreationFormSubmittable(
  values: CharacterCreationRequest
): boolean {
  return getFirstInvalidCharacterCreationStep(values) === null;
}
