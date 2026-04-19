import type { UseFormReturn } from "react-hook-form";
import Button from "@/app/components/shared/Button";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { FEATURE_SLOT_INDEXES } from "./constants";
import type {
  FeatureChoiceMode,
  FeatureOption,
  LevelUpFormValues,
  PathOption,
} from "./types";

type Props = {
  form: UseFormReturn<LevelUpFormValues>;
  watchedPathId: string;
  choices: LevelUpFormValues["choices"];
  pathOptions: { value: string; label: string }[];
  loadingPaths: boolean;
  loadingFeatures: boolean;
  selectedPathInfo: PathOption | null;
  isSelectedPathNew: boolean;
  alternativeNewPathOptions: PathOption[];
  activeFeatureSlot: 0 | 1;
  setActiveFeatureSlot: (slot: 0 | 1) => void;
  features: FeatureOption[];
  existingFeatureById: Map<string, { grade: number; maxGrade: number }>;
  choicesError: string | undefined;
  setFeatureChoiceAtSlot: (
    slot: 0 | 1,
    mode: FeatureChoiceMode,
    featureId: string
  ) => void;
};

export default function LevelUpPathFeaturesStep({
  form,
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
  choicesError,
  setFeatureChoiceAtSlot,
}: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-black/70">
        Choose a path to advance (existing or new), then apply exactly two
        feature upgrades.
      </p>
      <SelectDropdown
        id="path-id"
        label="Path"
        placeholder={loadingPaths ? "Loading paths..." : "Select a path"}
        value={watchedPathId}
        options={pathOptions}
        disabled={loadingPaths}
        onChange={(v) => form.setValue("pathId", v, { shouldDirty: true })}
      />
      {form.formState.errors.pathId?.message && (
        <p className="text-sm text-neblirDanger-600" role="alert">
          {form.formState.errors.pathId.message}
        </p>
      )}
      {selectedPathInfo && (
        <div className="rounded border border-black/20 bg-black/5 p-2 text-sm">
          <p className="font-medium">
            Selected path: {selectedPathInfo.name.replace(/_/g, " ")}
          </p>
          <p className="mt-1 text-black/70">
            Base feature: {selectedPathInfo.baseFeature}
          </p>
          {selectedPathInfo.description && (
            <p className="mt-1 text-black/70">{selectedPathInfo.description}</p>
          )}
        </div>
      )}
      {isSelectedPathNew && alternativeNewPathOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-black">
            Other new path options
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {alternativeNewPathOptions.map((path) => (
              <Button
                key={path.id}
                type="button"
                variant="lightPathCard"
                fullWidth={false}
                className="h-auto w-full"
                onClick={() =>
                  form.setValue("pathId", path.id, { shouldDirty: true })
                }
              >
                <p className="font-semibold text-black">
                  {path.name.replace(/_/g, " ")}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-black/55">
                  Base feature
                </p>
                <p className="text-sm text-black">{path.baseFeature}</p>
                {path.description && (
                  <p className="mt-2 text-sm text-black/70 line-clamp-4">
                    {path.description}
                  </p>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}
      {loadingFeatures && (
        <p className="text-sm text-black/60">Loading feature options...</p>
      )}
      <div className="space-y-3 rounded border border-black/20 p-3">
        <p className="text-sm font-medium text-black">
          Feature upgrade slots (pick 2)
        </p>
        <div className="flex gap-2">
          {FEATURE_SLOT_INDEXES.map((idx) => {
            const isActive = activeFeatureSlot === idx;
            const slotChoice = choices[idx];
            const featureName = features.find(
              (f) => f.id === slotChoice?.featureId
            )?.name;
            return (
              <Button
                key={idx}
                type="button"
                variant={isActive ? "lightSlotActive" : "lightSlotIdle"}
                fullWidth={false}
                className="min-w-0"
                onClick={() => setActiveFeatureSlot(idx)}
              >
                <p className="font-semibold">Slot {idx + 1}</p>
                <p className="text-xs text-black/70">
                  {slotChoice?.mode === "none" || !slotChoice?.featureId
                    ? "Not selected"
                    : `${slotChoice.mode === "new" ? "New" : "Increase"}: ${featureName ?? slotChoice.featureId}`}
                </p>
              </Button>
            );
          })}
        </div>
        <Button
          type="button"
          variant="lightCompactXsMuted"
          fullWidth={false}
          onClick={() => {
            setFeatureChoiceAtSlot(activeFeatureSlot, "none", "");
            form.clearErrors([
              "choices",
              "choices.0.featureId",
              "choices.1.featureId",
            ]);
          }}
        >
          Clear active slot
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => {
          const existing = existingFeatureById.get(feature.id);
          const canPickNew = !existing;
          const canIncrease = Boolean(
            existing && existing.grade < feature.maxGrade
          );
          const selectedSlotIndexes = FEATURE_SLOT_INDEXES.filter(
            (slotIdx) =>
              choices[slotIdx]?.featureId === feature.id &&
              choices[slotIdx]?.mode !== "none"
          );
          const isSelected = selectedSlotIndexes.length > 0;
          return (
            <div
              key={feature.id}
              className={`flex h-40 flex-col rounded border-2 p-3 sm:h-44 xl:h-48 ${
                isSelected
                  ? "border-customPrimary bg-customPrimary/5"
                  : "border-black/20"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-black">{feature.name}</p>
                {selectedSlotIndexes.map((slotIdx) => {
                  const mode = choices[slotIdx]?.mode;
                  return (
                    <span
                      key={`${feature.id}-slot-${slotIdx}`}
                      className="rounded-full border border-customPrimary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-customPrimary"
                    >
                      Slot {slotIdx + 1} {mode === "new" ? "new" : "increase"}
                    </span>
                  );
                })}
                <span className="text-xs text-black/60">
                  Max grade: {feature.maxGrade}
                </span>
                {existing ? (
                  <span className="text-xs text-black/60">
                    Current grade: {existing.grade}
                  </span>
                ) : (
                  <span className="text-xs text-black/60">Not learned yet</span>
                )}
              </div>
              <div className="mt-2 min-h-0 flex-1 overflow-y-auto pr-1">
                {feature.description && (
                  <p className="text-sm text-black/70">{feature.description}</p>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={
                    canPickNew
                      ? "lightChipSafeCompact"
                      : "lightChipNeutralMuted"
                  }
                  fullWidth={false}
                  disabled={!canPickNew}
                  onClick={() =>
                    setFeatureChoiceAtSlot(activeFeatureSlot, "new", feature.id)
                  }
                >
                  Pick as new
                </Button>
                <Button
                  type="button"
                  variant={
                    canIncrease
                      ? "lightChipSafeCompact"
                      : "lightChipNeutralMuted"
                  }
                  fullWidth={false}
                  disabled={!canIncrease}
                  onClick={() =>
                    setFeatureChoiceAtSlot(
                      activeFeatureSlot,
                      "increment",
                      feature.id
                    )
                  }
                >
                  Increase grade
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {choicesError && (
        <p className="text-sm text-neblirDanger-600" role="alert">
          {choicesError}
        </p>
      )}
    </div>
  );
}
