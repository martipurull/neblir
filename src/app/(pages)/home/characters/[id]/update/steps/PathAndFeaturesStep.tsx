"use client";

import { UpdateOwnedFeaturesList } from "./UpdateOwnedFeaturesList";
import { UpdateOwnedPathsEditor } from "./UpdateOwnedPathsEditor";
import { usePathAndFeaturesStep } from "./usePathAndFeaturesStep";

export function PathAndFeaturesStep() {
  const {
    level,
    ownedPaths,
    ownedFeatures,
    pathError,
    cataloguePaths,
    visibleFeatures,
    loadingPaths,
    loadingFeatures,
    pathToAdd,
    unallocatedLevel,
    featureSlots,
    selectedGradeSum,
    slotsLeft,
    isOverAllocated,
    canAddPath,
    addablePathOptions,
    illegalOwnedFeatures,
    illegalOwnedIds,
    setPathToAdd,
    addPath,
    removePath,
    setPathRank,
    addFeature,
    setFeatureGrade,
  } = usePathAndFeaturesStep();

  return (
    <div className="space-y-4">
      <p className="text-sm text-black/70">
        Edit every path and its rank. Unallocated level must be 0 before saving
        (ranks sum to level). You may choose features using a total of up to{" "}
        <strong>{featureSlots}</strong> feature grade slots (2 × (level − 1)).
      </p>

      <UpdateOwnedPathsEditor
        ownedPaths={ownedPaths}
        cataloguePaths={cataloguePaths}
        pathError={pathError}
        unallocatedLevel={unallocatedLevel}
        pathToAdd={pathToAdd}
        addablePathOptions={addablePathOptions}
        loadingPaths={loadingPaths}
        canAddPath={canAddPath}
        onPathToAddChange={setPathToAdd}
        onAddPath={addPath}
        onRemovePath={removePath}
        onSetPathRank={setPathRank}
      />

      <UpdateOwnedFeaturesList
        ownedPathsCount={ownedPaths.length}
        level={level}
        ownedFeatures={ownedFeatures}
        visibleFeatures={visibleFeatures}
        loadingFeatures={loadingFeatures}
        featureSlots={featureSlots}
        selectedGradeSum={selectedGradeSum}
        slotsLeft={slotsLeft}
        isOverAllocated={isOverAllocated}
        illegalOwnedFeatures={illegalOwnedFeatures}
        illegalOwnedIds={illegalOwnedIds}
        onAddFeature={addFeature}
        onSetFeatureGrade={setFeatureGrade}
      />
    </div>
  );
}
