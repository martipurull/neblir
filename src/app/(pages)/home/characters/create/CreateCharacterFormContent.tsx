"use client";

import { Stepper } from "@/app/components/shared/Stepper";
import { useFormContext } from "react-hook-form";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { BackstoryStep } from "./steps/BackstoryStep";
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
    canProceedFromCurrentStep,
    canSubmitCharacter,
    goToStep,
    onBack,
    onNext,
    submitCharacter,
  } = useCharacterCreateController();

  const { handleSubmit } = useFormContext<CharacterCreationRequest>();

  return (
    <>
      <Stepper
        steps={steps}
        currentStepIndex={currentStepIndex}
        onStepClick={goToStep}
        className="mb-8"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(submitCharacter)(e);
        }}
        className="flex flex-col gap-6"
      >
        {currentStepIndex === 0 && <BackstoryStep />}
        {currentStepIndex === 1 && <GeneralInfoStep />}
        {currentStepIndex === 2 && <AttributesStep />}
        {currentStepIndex === 3 && <HealthStep />}
        {currentStepIndex === 4 && <LearnedSkillsStep />}
        {currentStepIndex === 5 && (
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
          canProceedFromCurrentStep={canProceedFromCurrentStep}
          canSubmitCharacter={canSubmitCharacter}
          onBack={onBack}
          onNext={onNext}
        />
      </form>
    </>
  );
}
