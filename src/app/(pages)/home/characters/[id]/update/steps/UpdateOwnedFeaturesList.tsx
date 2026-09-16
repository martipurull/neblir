"use client";

import { ExpandableClamp } from "@/app/components/shared/ExpandableClamp";
import { StoredRichTextHtml } from "@/app/components/shared/StoredRichTextHtml";
import { Button } from "@/app/components/shared/Button";
import { NumberField } from "@/app/components/shared/NumberField";
import type { CharacterUpdateFeatureEntry } from "../schemas";
import { parseAtLeastOne } from "./pathAndFeaturesFormat";
import type { UnionCatalogueFeature } from "./unionCatalogueFeatures";

type UpdateOwnedFeaturesListProps = {
  ownedPathsCount: number;
  level: number;
  ownedFeatures: CharacterUpdateFeatureEntry[];
  visibleFeatures: UnionCatalogueFeature[];
  loadingFeatures: boolean;
  featureSlots: number;
  selectedGradeSum: number;
  slotsLeft: number;
  isOverAllocated: boolean;
  illegalOwnedFeatures: CharacterUpdateFeatureEntry[];
  illegalOwnedIds: Set<string>;
  onAddFeature: (featureId: string) => void;
  onSetFeatureGrade: (featureId: string, grade: number) => void;
};

export function UpdateOwnedFeaturesList({
  ownedPathsCount,
  level,
  ownedFeatures,
  visibleFeatures,
  loadingFeatures,
  featureSlots,
  selectedGradeSum,
  slotsLeft,
  isOverAllocated,
  illegalOwnedFeatures,
  illegalOwnedIds,
  onAddFeature,
  onSetFeatureGrade,
}: UpdateOwnedFeaturesListProps) {
  return (
    <>
      <div className="sticky top-2 z-10 flex justify-end">
        <div
          className={`rounded-md border px-3 py-2 text-sm font-semibold shadow-sm backdrop-blur ${
            isOverAllocated
              ? "border-neblirDanger-600 bg-neblirDanger-200/30 text-neblirDanger"
              : "border-black/20 bg-paleBlue text-black"
          }`}
        >
          Feature grade slots used: {selectedGradeSum} / {featureSlots}
        </div>
      </div>
      {isOverAllocated && (
        <p className="text-sm text-neblirDanger-600" role="alert">
          Selected feature grades exceed available feature grade slots (
          {featureSlots}).
        </p>
      )}

      {illegalOwnedFeatures.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neblirDanger">
            These owned features are not legal for the current paths and ranks.
            Raise a rank, add a path, or remove the feature.
          </p>
          {illegalOwnedFeatures.map((feature) => (
            <div
              key={feature.featureId}
              className="flex flex-wrap items-center gap-2 rounded border border-neblirDanger-600 bg-neblirDanger-200/30 p-2"
            >
              <span className="font-medium">
                {feature.name ?? feature.featureId}
              </span>
              <span className="text-xs text-black/60">
                (grade {feature.grade})
              </span>
              <Button
                type="button"
                variant="lightChipDangerCompact"
                fullWidth={false}
                onClick={() => onSetFeatureGrade(feature.featureId, 0)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {ownedPathsCount > 0 && level <= 1 && ownedFeatures.length === 0 && (
        <p className="text-sm text-black/60">
          At level 1 you don’t pick additional features yet.
        </p>
      )}

      {ownedPathsCount > 0 && (level > 1 || ownedFeatures.length > 0) && (
        <div className="space-y-2">
          {loadingFeatures && (
            <p className="text-sm text-black/60">Loading features…</p>
          )}
          {!loadingFeatures &&
            visibleFeatures.length === 0 &&
            ownedFeatures.length === 0 && (
              <p className="text-sm text-black/60">
                No features available for the current paths and ranks.
              </p>
            )}
          {visibleFeatures.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {visibleFeatures.map((feature) => (
                <UpdateOwnedFeatureCard
                  key={feature.id}
                  feature={feature}
                  selected={ownedFeatures.find(
                    (entry) => entry.featureId === feature.id
                  )}
                  isIllegal={illegalOwnedIds.has(feature.id)}
                  slotsLeft={slotsLeft}
                  onAddFeature={onAddFeature}
                  onSetFeatureGrade={onSetFeatureGrade}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function UpdateOwnedFeatureCard({
  feature,
  selected,
  isIllegal,
  slotsLeft,
  onAddFeature,
  onSetFeatureGrade,
}: {
  feature: UnionCatalogueFeature;
  selected: CharacterUpdateFeatureEntry | undefined;
  isIllegal: boolean;
  slotsLeft: number;
  onAddFeature: (featureId: string) => void;
  onSetFeatureGrade: (featureId: string, grade: number) => void;
}) {
  const description = feature.description ?? "";
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded border p-2 ${
        selected
          ? isIllegal
            ? "border-neblirDanger-600"
            : "border-neblirSafe-400"
          : "border-black/20"
      }`}
    >
      <span className="font-medium">{feature.name}</span>
      <span className="text-xs text-black/60">
        (grade 1–{feature.maxGrade})
      </span>
      {description.trim().length > 0 && (
        <div className="w-full">
          <ExpandableClamp
            contentClassName="mt-1 text-xs text-black/70"
            clampClassName="max-h-12 overflow-hidden"
            measureKey={description}
          >
            <StoredRichTextHtml
              content={description}
              className="text-xs text-black/70"
            />
          </ExpandableClamp>
        </div>
      )}
      {!selected ? (
        <Button
          type="button"
          variant="lightChipSafe"
          fullWidth={false}
          onClick={() => onAddFeature(feature.id)}
          disabled={slotsLeft < 1}
        >
          + Add (grade 1)
        </Button>
      ) : (
        <>
          <label className="flex items-center gap-1 text-sm">
            Grade:
            <NumberField
              id={`feature-grade-${feature.id}`}
              min={1}
              max={feature.maxGrade}
              value={selected.grade}
              stepperLabel={`${feature.name} grade`}
              onChange={(raw) =>
                onSetFeatureGrade(feature.id, parseAtLeastOne(raw))
              }
              className="!w-14 !min-h-8"
              inputClassName="px-1 py-0.5 text-sm"
            />
          </label>
          <Button
            type="button"
            variant="lightChipDangerCompact"
            fullWidth={false}
            onClick={() => onSetFeatureGrade(feature.id, selected.grade - 1)}
          >
            - Grade
          </Button>
          <Button
            type="button"
            variant="lightChipSafeCompact"
            fullWidth={false}
            onClick={() => onAddFeature(feature.id)}
            disabled={selected.grade >= feature.maxGrade || slotsLeft < 1}
          >
            + Grade
          </Button>
        </>
      )}
    </div>
  );
}
