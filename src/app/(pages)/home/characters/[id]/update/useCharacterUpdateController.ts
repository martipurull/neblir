"use client";

import { useCallback, useEffect, useState } from "react";
import type { z } from "zod";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import { characterCreationRequestSchema } from "@/app/api/characters/schemas";
import { updateCharacterEditableFields } from "@/lib/api/character";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import {
  getFeatureGradeSlots,
  getUnallocatedLevel,
  isOwnedFeatureLegal,
  toCharacterUpdateRequest,
  type CharacterUpdateFormValues,
} from "./schemas";

const STEPS = [
  { id: "backstory", label: "Backstory" },
  { id: "general", label: "General" },
  { id: "attributes", label: "Attributes" },
  { id: "health", label: "Health" },
  { id: "skills", label: "Skills" },
  { id: "path", label: "Path" },
];

function setZodErrors(
  setError: UseFormSetError<CharacterUpdateFormValues>,
  error: z.ZodError
) {
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (path) setError(path as never, { message: issue.message });
    else
      setError("generalInformation" as never, {
        message: issue.message,
      });
  }
}

function summarizeZodError(error: z.ZodError): string {
  const lines = error.issues.map((issue) => {
    const loc = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${loc}${issue.message}`;
  });
  return [...new Set(lines)].join(" ");
}

export function useCharacterUpdateController() {
  const router = useRouter();
  const params = useParams();
  const characterId = typeof params.id === "string" ? params.id : "";
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showLevelDecreaseConfirm, setShowLevelDecreaseConfirm] =
    useState(false);
  const [pendingStepIndex, setPendingStepIndex] = useState<number | null>(null);
  const [confirmedLevel, setConfirmedLevel] = useState<number | null>(null);
  const [initialLevel, setInitialLevel] = useState<number | null>(null);
  const [nextValidationMessage, setNextValidationMessage] = useState<
    string | null
  >(null);

  const { getValues, setError, clearErrors, watch } =
    useFormContext<CharacterUpdateFormValues>();
  const watchedLevel = watch("generalInformation.level");
  const watchedPaths = watch("paths");
  const watchedInitialFeatures = watch("initialFeatures");
  const _watchedHealth = watch("health");
  const _watchedLearnedSkills = watch("learnedSkills");

  useEffect(() => {
    if (typeof watchedLevel !== "number") return;
    if (confirmedLevel === null) setConfirmedLevel(watchedLevel);
    if (initialLevel === null) setInitialLevel(watchedLevel);
  }, [confirmedLevel, initialLevel, watchedLevel]);

  const getPathConstraintErrors = useCallback(
    (values: CharacterUpdateFormValues) => {
      const errors: string[] = [];
      const paths = values.paths ?? [];
      const level = values.generalInformation?.level ?? 1;

      if (paths.length === 0) {
        errors.push("At least one path is required");
      }
      for (const path of paths) {
        if (path.rank < 1) {
          errors.push("Each path rank must be at least 1");
          break;
        }
      }

      const unallocatedLevel = getUnallocatedLevel(level, paths);
      if (unallocatedLevel > 0) {
        errors.push(
          `Unallocated level is ${unallocatedLevel}. Assign all level to path ranks before saving.`
        );
      } else if (unallocatedLevel < 0) {
        errors.push(
          `Path ranks exceed level by ${-unallocatedLevel}. Reduce ranks or raise level before saving.`
        );
      }

      const illegalFeatures = (values.initialFeatures ?? []).filter(
        (feature) => !isOwnedFeatureLegal(feature, paths)
      );
      for (const feature of illegalFeatures) {
        errors.push(
          feature.name
            ? `Feature ${feature.name} is not legal for the submitted paths and ranks`
            : "An owned feature is not legal for the current paths and ranks"
        );
      }

      const featureSlots = getFeatureGradeSlots(level);
      const selectedFeatureGradeSum = (values.initialFeatures ?? []).reduce(
        (sum, entry) => sum + entry.grade,
        0
      );
      if (selectedFeatureGradeSum > featureSlots) {
        errors.push(
          `Selected feature grades exceed available feature grade slots (${featureSlots}).`
        );
      }
      return errors;
    },
    []
  );

  const getLevelConstraintErrors = useCallback(
    (values: CharacterUpdateFormValues) => {
      const errors: string[] = [];
      const level = values.generalInformation?.level ?? 1;
      const maxRolled = 10 * level;
      const minRolled = 10 + Math.max(0, level - 1);
      const rolledPhysical = values.health?.rolledPhysicalHealth ?? 10;
      const rolledMental = values.health?.rolledMentalHealth ?? 10;
      if (rolledPhysical < minRolled || rolledPhysical > maxRolled) {
        errors.push(
          `Physical rolled health must be between ${minRolled} and ${maxRolled} for level ${level}.`
        );
      }
      if (rolledMental < minRolled || rolledMental > maxRolled) {
        errors.push(
          `Mental rolled health must be between ${minRolled} and ${maxRolled} for level ${level}.`
        );
      }

      const filledSpecial =
        values.learnedSkills?.specialSkills?.filter((s) => s?.trim()).length ??
        0;
      const learnedSkillsMax = 13 + level + (3 - filledSpecial);
      const skillSum = Object.values(
        values.learnedSkills?.generalSkills ?? {}
      ).reduce((acc, v) => acc + (v === 5 ? 6 : v), 0);
      if (skillSum > learnedSkillsMax) {
        errors.push(`Learned skills exceed maximum (${learnedSkillsMax}).`);
      }

      errors.push(...getPathConstraintErrors(values));
      return errors;
    },
    [getPathConstraintErrors]
  );

  const validateCurrentStep = useCallback((): string | null => {
    clearErrors();
    const values = getValues();

    if (currentStepIndex === 0) return null;

    if (currentStepIndex === 1) {
      const res =
        characterCreationRequestSchema.shape.generalInformation.safeParse(
          values.generalInformation
        );
      if (!res.success) {
        setZodErrors(setError, res.error);
        return summarizeZodError(res.error);
      }
      const walletRes = characterCreationRequestSchema.shape.wallet.safeParse(
        values.wallet
      );
      if (!walletRes.success) {
        setZodErrors(setError, walletRes.error);
        return summarizeZodError(walletRes.error);
      }
      return null;
    }

    if (currentStepIndex === 2) {
      const res =
        characterCreationRequestSchema.shape.innateAttributes.safeParse(
          values.innateAttributes
        );
      if (!res.success) {
        setZodErrors(setError, res.error);
        return summarizeZodError(res.error);
      }

      const groups = Object.values(values.innateAttributes ?? {});
      const sum = groups.reduce((acc, g) => {
        const groupSum = Object.values(g as Record<string, number>).reduce(
          (a, v) => a + v,
          0
        );
        return acc + groupSum;
      }, 0);

      if (sum > 36) {
        const msg = "Innate attributes sum cannot exceed 36.";
        setError("innateAttributes" as never, { message: msg });
        return msg;
      }
      return null;
    }

    if (currentStepIndex === 3) {
      const level = values.generalInformation?.level ?? 1;
      const healthRes = characterCreationRequestSchema.shape.health.safeParse(
        values.health
      );
      if (!healthRes.success) {
        setZodErrors(setError, healthRes.error);
        return summarizeZodError(healthRes.error);
      }

      const maxRolled = 10 * level;
      const minRolled = 10 + Math.max(0, level - 1);
      const rolledPhysical = values.health?.rolledPhysicalHealth ?? 10;
      const rolledMental = values.health?.rolledMentalHealth ?? 10;

      if (rolledPhysical < minRolled || rolledPhysical > maxRolled) {
        const msg = `Physical rolled health must be between ${minRolled} and ${maxRolled} for level ${level}.`;
        setError("health.rolledPhysicalHealth" as never, { message: msg });
        return msg;
      }

      if (rolledMental < minRolled || rolledMental > maxRolled) {
        const msg = `Mental rolled health must be between ${minRolled} and ${maxRolled} for level ${level}.`;
        setError("health.rolledMentalHealth" as never, { message: msg });
        return msg;
      }

      return null;
    }

    if (currentStepIndex === 4) {
      const res = characterCreationRequestSchema.shape.learnedSkills.safeParse(
        values.learnedSkills
      );
      if (!res.success) {
        setZodErrors(setError, res.error);
        return summarizeZodError(res.error);
      }

      const level = values.generalInformation?.level ?? 1;
      const filledSpecial =
        values.learnedSkills?.specialSkills?.filter((s) => s?.trim()).length ??
        0;
      const learnedSkillsMax = 13 + level + (3 - filledSpecial);
      const sum = Object.values(
        values.learnedSkills?.generalSkills ?? {}
      ).reduce((acc, v) => acc + (v === 5 ? 6 : v), 0);

      if (sum > learnedSkillsMax) {
        const msg = `Learned skills exceed maximum (${learnedSkillsMax}).`;
        setError("learnedSkills.generalSkills" as never, { message: msg });
        return msg;
      }
      return null;
    }

    if (currentStepIndex === 5) {
      const pathErrors = getPathConstraintErrors(values);
      if (pathErrors.length > 0) {
        setError("paths" as never, { message: pathErrors[0] });
        return pathErrors[0];
      }
      return null;
    }

    return null;
  }, [
    clearErrors,
    currentStepIndex,
    getPathConstraintErrors,
    getValues,
    setError,
  ]);

  const validateAllSteps = useCallback((): number | null => {
    clearErrors();
    const values = getValues();

    const generalRes =
      characterCreationRequestSchema.shape.generalInformation.safeParse(
        values.generalInformation
      );
    if (!generalRes.success) {
      setZodErrors(setError, generalRes.error);
      return 1;
    }
    const walletRes = characterCreationRequestSchema.shape.wallet.safeParse(
      values.wallet
    );
    if (!walletRes.success) {
      setZodErrors(setError, walletRes.error);
      return 1;
    }

    const attrRes =
      characterCreationRequestSchema.shape.innateAttributes.safeParse(
        values.innateAttributes
      );
    if (!attrRes.success) {
      setZodErrors(setError, attrRes.error);
      return 2;
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
      return 2;
    }

    const healthRes = characterCreationRequestSchema.shape.health.safeParse(
      values.health
    );
    if (!healthRes.success) {
      setZodErrors(setError, healthRes.error);
      return 3;
    }
    const level = values.generalInformation?.level ?? 1;
    const maxRolled = 10 * level;
    const minRolled = 10 + Math.max(0, level - 1);
    const rolledPhysical = values.health?.rolledPhysicalHealth ?? 10;
    const rolledMental = values.health?.rolledMentalHealth ?? 10;
    if (rolledPhysical < minRolled || rolledPhysical > maxRolled) {
      setError("health.rolledPhysicalHealth" as never, {
        message: `Physical rolled health must be between ${minRolled} and ${maxRolled} for level ${level}.`,
      });
      return 3;
    }
    if (rolledMental < minRolled || rolledMental > maxRolled) {
      setError("health.rolledMentalHealth" as never, {
        message: `Mental rolled health must be between ${minRolled} and ${maxRolled} for level ${level}.`,
      });
      return 3;
    }

    const skillsRes =
      characterCreationRequestSchema.shape.learnedSkills.safeParse(
        values.learnedSkills
      );
    if (!skillsRes.success) {
      setZodErrors(setError, skillsRes.error);
      return 4;
    }
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
      return 4;
    }

    const pathErrors = getPathConstraintErrors(values);
    if (pathErrors.length > 0) {
      setError("paths" as never, { message: pathErrors[0] });
      return 5;
    }
    return null;
  }, [clearErrors, getPathConstraintErrors, getValues, setError]);

  const needsLevelDecreaseConfirmation = useCallback(() => {
    const values = getValues();
    const level = values.generalInformation?.level ?? 1;
    if (confirmedLevel == null) return false;
    if (level >= confirmedLevel) return false;
    return getLevelConstraintErrors(values).length > 0;
  }, [confirmedLevel, getLevelConstraintErrors, getValues]);

  const goToStep = useCallback(
    (stepIndex: number) => {
      setSubmitSuccess(false);
      setNextValidationMessage(null);
      if (stepIndex === currentStepIndex) return;
      if (currentStepIndex === 1 && needsLevelDecreaseConfirmation()) {
        setPendingStepIndex(stepIndex);
        setShowLevelDecreaseConfirm(true);
        return;
      }
      setCurrentStepIndex(Math.max(0, Math.min(STEPS.length - 1, stepIndex)));
    },
    [currentStepIndex, needsLevelDecreaseConfirmation]
  );

  const onNext = useCallback(() => {
    setSubmitSuccess(false);
    const validationMessage = validateCurrentStep();
    if (validationMessage !== null) {
      setNextValidationMessage(validationMessage);
      return;
    }
    setNextValidationMessage(null);
    if (currentStepIndex === 1 && needsLevelDecreaseConfirmation()) {
      setPendingStepIndex(Math.min(STEPS.length - 1, currentStepIndex + 1));
      setShowLevelDecreaseConfirm(true);
      return;
    }
    setCurrentStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  }, [currentStepIndex, needsLevelDecreaseConfirmation, validateCurrentStep]);

  const onBack = useCallback(() => {
    setSubmitSuccess(false);
    setNextValidationMessage(null);
    if (currentStepIndex === 1 && needsLevelDecreaseConfirmation()) {
      setPendingStepIndex(Math.max(0, currentStepIndex - 1));
      setShowLevelDecreaseConfirm(true);
      return;
    }
    setCurrentStepIndex((i) => Math.max(0, i - 1));
    setSubmitError(null);
  }, [currentStepIndex, needsLevelDecreaseConfirmation]);

  const onSubmit = useCallback(
    async (values: CharacterUpdateFormValues) => {
      setSubmitError(null);
      setSubmitSuccess(false);
      setNextValidationMessage(null);
      const firstInvalidStep = validateAllSteps();
      if (firstInvalidStep !== null) {
        setCurrentStepIndex(firstInvalidStep);
        return;
      }
      setIsSubmitting(true);
      try {
        await updateCharacterEditableFields(
          characterId,
          toCharacterUpdateRequest({
            ...values,
            learnedSkills: {
              ...values.learnedSkills,
              specialSkills:
                values.learnedSkills.specialSkills?.filter((s) => s?.trim()) ??
                [],
            },
            wallet:
              values.wallet && values.wallet.length > 0
                ? values.wallet.filter((e) => e.quantity > 0)
                : [],
          })
        );
        setSubmitSuccess(true);
        router.replace(`/home/characters/${characterId}`);
      } catch (e) {
        setSubmitError(
          getUserSafeErrorMessage(e, "Failed to update character")
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [characterId, router, validateAllSteps]
  );

  const onConfirmLevelDecrease = useCallback(() => {
    const values = getValues();
    const nextLevel = values.generalInformation?.level ?? 1;
    setConfirmedLevel(nextLevel);
    setShowLevelDecreaseConfirm(false);
    if (pendingStepIndex !== null) {
      setCurrentStepIndex(pendingStepIndex);
      setPendingStepIndex(null);
    }
  }, [getValues, pendingStepIndex]);

  const onCancelLevelDecrease = useCallback(() => {
    setShowLevelDecreaseConfirm(false);
    setPendingStepIndex(null);
  }, []);

  const currentValues = getValues();
  const pathConstraintErrors = getPathConstraintErrors({
    ...currentValues,
    paths: watchedPaths ?? currentValues.paths ?? [],
    initialFeatures: watchedInitialFeatures ?? currentValues.initialFeatures,
  });
  const hasBlockingPathIssues = pathConstraintErrors.length > 0;
  const hasBlockingLevelIssues =
    initialLevel !== null &&
    (watchedLevel ?? 1) < initialLevel &&
    getLevelConstraintErrors(currentValues).length > 0;

  return {
    characterId,
    steps: STEPS,
    currentStepIndex,
    isLastStep: currentStepIndex === STEPS.length - 1,
    isSubmitting,
    submitError,
    submitSuccess,
    pathConstraintErrors,
    showLevelDecreaseConfirm,
    nextValidationMessage,
    hasBlockingLevelIssues,
    hasBlockingPathIssues,
    onConfirmLevelDecrease,
    onCancelLevelDecrease,
    goToStep,
    onBack,
    onNext,
    onSubmit,
  };
}
