"use client";

import { Stepper } from "@/app/components/shared/Stepper";
import { characterCreationRequestSchema } from "@/app/api/characters/schemas";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { useFormContext } from "react-hook-form";
import React from "react";
import { GeneralInfoStep } from "./steps/GeneralInfoStep";
import { AttributesStep } from "./steps/AttributesStep";
import { HealthStep } from "./steps/HealthStep";
import { LearnedSkillsStep } from "./steps/LearnedSkillsStep";
import { PathAndFeaturesStep } from "./steps/PathAndFeaturesStep";
import { useCharacterCreateController } from "./useCharacterCreateController";
import { CharacterCreateFooter } from "./CharacterCreateFooter";

export function CreateCharacterFormContent() {
  const {
    steps,
    currentStepIndex,
    isLastStep,
    isSubmitting,
    submitError,
    initialFeatures,
    setInitialFeatures,
    onBack,
    onNext,
    onSubmit,
  } = useCharacterCreateController();

  const { handleSubmit, setError } = useFormContext<CharacterCreationRequest>();

  return (
    <>
      <Stepper
        steps={steps}
        currentStepIndex={currentStepIndex}
        className="mb-8"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(async (values) => {
            const parsed = characterCreationRequestSchema.safeParse(values);
            if (!parsed.success) {
              // Reuse the controller's error mapping by delegating validation to Next/submit validation;
              // but keep current schema mapping for final submission.
              const issues = parsed.error.issues;
              for (const issue of issues) {
                const path = issue.path.join(".") as never;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setError(path as any, { message: issue.message });
              }
              return;
            }
            await onSubmit(parsed.data);
          })(e);
        }}
        className="flex flex-col gap-6"
      >
        {currentStepIndex === 0 && <GeneralInfoStep />}
        {currentStepIndex === 1 && <AttributesStep />}
        {currentStepIndex === 2 && <HealthStep />}
        {currentStepIndex === 3 && <LearnedSkillsStep />}
        {currentStepIndex === 4 && (
          <PathAndFeaturesStep
            onInitialFeaturesChange={setInitialFeatures}
            initialFeatures={initialFeatures}
          />
        )}

        {submitError && (
          <p className="text-sm text-neblirDanger-600" role="alert">
            {submitError}
          </p>
        )}

        <CharacterCreateFooter
          currentStepIndex={currentStepIndex}
          isLastStep={isLastStep}
          isSubmitting={isSubmitting}
          onBack={onBack}
          onNext={onNext}
        />
      </form>
    </>
  );
}
