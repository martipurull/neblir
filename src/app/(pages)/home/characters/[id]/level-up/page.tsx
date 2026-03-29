"use client";

import { useParams, useRouter } from "next/navigation";
import Button from "@/app/components/shared/Button";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageSubtitle from "@/app/components/shared/PageSubtitle";
import PageTitle from "@/app/components/shared/PageTitle";
import { WarningButton } from "@/app/components/shared/SemanticActionButton";
import { Stepper } from "@/app/components/shared/Stepper";
import type { CharacterDetail } from "@/app/lib/types/character";
import { useCharacter } from "@/hooks/use-character";
import { clearLevelUpDraft } from "./draft-storage";
import LevelUpAttributesStep from "./LevelUpAttributesStep";
import LevelUpHealthStep from "./LevelUpHealthStep";
import LevelUpPathFeaturesStep from "./LevelUpPathFeaturesStep";
import LevelUpQuickCheckModal from "./LevelUpQuickCheckModal";
import LevelUpSkillStep from "./LevelUpSkillStep";
import { STEPS } from "./constants";
import { useCharacterLevelUp } from "./useCharacterLevelUp";

function CharacterLevelUpLoaded({
  id,
  character,
}: {
  id: string;
  character: CharacterDetail;
}) {
  const router = useRouter();
  const {
    form,
    currentStepIndex,
    setCurrentStepIndex,
    validateStep,
    onSubmit,
    submitError,
    submitSuccess,
    isSubmitting,
    openQuickCheck,
    setOpenQuickCheck,
    targetLevel,
    seriousFlag,
    attributeError,
    healthError,
    choicesError,
    attributeSwapFromOptions,
    attributeSwapToOptions,
    healthPreview,
    watchedPathId,
    choices,
    pathOptions,
    loadingPaths,
    loadingFeatures,
    selectedPathInfo,
    isSelectedPathNew,
    alternativeNewPathOptions,
    activeFeatureSlot,
    setActiveFeatureSlot,
    features,
    existingFeatureById,
    setFeatureChoiceAtSlot,
    groupedAttributesForDisplay,
    currentSkillsForDisplay,
  } = useCharacterLevelUp(id, character);

  return (
    <PageSection>
      <div className="mb-3 flex justify-center">
        <WarningButton
          type="button"
          onClick={() => {
            clearLevelUpDraft(id);
            router.push(`/home/characters/${id}`);
          }}
          className="text-xs"
        >
          Exit to character page
        </WarningButton>
      </div>
      <PageTitle>Level Up Character</PageTitle>
      <PageSubtitle>
        Levelling up from level {character.generalInformation.level} to{" "}
        {targetLevel}.
      </PageSubtitle>
      <p className="mt-2 mb-6 text-sm text-black/70">
        All level-based effects are calculated for level {targetLevel}.
      </p>

      <Stepper
        steps={STEPS}
        currentStepIndex={currentStepIndex}
        onStepClick={(step) => setCurrentStepIndex(step)}
        className="mb-8"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(e);
        }}
        className="flex flex-col gap-6"
      >
        {currentStepIndex === 0 && (
          <LevelUpAttributesStep
            form={form}
            seriousFlag={seriousFlag}
            attributeSwapFromOptions={attributeSwapFromOptions}
            attributeSwapToOptions={attributeSwapToOptions}
            attributeError={attributeError}
            onOpenQuickCheck={() => setOpenQuickCheck("attributes")}
          />
        )}

        {currentStepIndex === 1 && (
          <LevelUpHealthStep
            form={form}
            healthPreview={healthPreview}
            healthError={healthError}
          />
        )}

        {currentStepIndex === 2 && (
          <LevelUpSkillStep
            form={form}
            targetLevel={targetLevel}
            onOpenQuickCheck={() => setOpenQuickCheck("skills")}
          />
        )}

        {currentStepIndex === 3 && (
          <LevelUpPathFeaturesStep
            form={form}
            watchedPathId={watchedPathId}
            choices={choices}
            pathOptions={pathOptions}
            loadingPaths={loadingPaths}
            loadingFeatures={loadingFeatures}
            selectedPathInfo={selectedPathInfo}
            isSelectedPathNew={isSelectedPathNew}
            alternativeNewPathOptions={alternativeNewPathOptions}
            activeFeatureSlot={activeFeatureSlot}
            setActiveFeatureSlot={setActiveFeatureSlot}
            features={features}
            existingFeatureById={existingFeatureById}
            choicesError={choicesError}
            setFeatureChoiceAtSlot={setFeatureChoiceAtSlot}
          />
        )}

        {submitError && (
          <p className="text-sm text-neblirDanger-600" role="alert">
            {submitError}
          </p>
        )}
        {submitSuccess && (
          <p className="text-sm text-neblirSafe-600" role="status">
            Character levelled up successfully.
          </p>
        )}

        <div className="flex gap-3">
          {currentStepIndex > 0 ? (
            <button
              type="button"
              onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
              className="min-h-11 flex-1 rounded-md border-2 border-black/30 px-4 py-2 text-black transition-colors hover:border-black/50"
            >
              Back
            </button>
          ) : (
            <div className="flex-1" />
          )}
          {currentStepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                if (validateStep(currentStepIndex)) {
                  setCurrentStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
                }
              }}
              className="min-h-11 flex-1 rounded-md bg-customPrimary px-4 py-2 text-customSecondary transition-colors hover:bg-customPrimaryHover"
            >
              Next
            </button>
          ) : (
            <div className="flex-1">
              <Button
                type="submit"
                text={isSubmitting ? "Levelling up..." : "Level up"}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>
      </form>

      <LevelUpQuickCheckModal
        open={openQuickCheck}
        onClose={() => setOpenQuickCheck(null)}
        groupedAttributesForDisplay={groupedAttributesForDisplay}
        currentSkillsForDisplay={currentSkillsForDisplay}
      />
    </PageSection>
  );
}

export default function CharacterLevelUpPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { character, loading, error, refetch } = useCharacter(id);

  if (id == null) {
    return (
      <PageSection>
        <p className="text-sm text-neblirDanger-600">Invalid character.</p>
      </PageSection>
    );
  }
  if (loading) {
    return (
      <PageSection>
        <LoadingState text="Loading character..." />
      </PageSection>
    );
  }
  if (error || !character) {
    return (
      <PageSection>
        <ErrorState
          message={error ?? "Character not found"}
          onRetry={refetch}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  return <CharacterLevelUpLoaded id={id} character={character} />;
}
