"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  getFeatureGradeSlots,
  getUnallocatedLevel,
  isOwnedFeatureLegal,
  type CharacterUpdateFeatureEntry,
  type CharacterUpdateFormValues,
  type CharacterUpdatePathEntry,
} from "../schemas";
import { formatPathLabel, type PathOption } from "./pathAndFeaturesFormat";
import {
  unionCatalogueFeatures,
  type UnionCatalogueFeature,
} from "./unionCatalogueFeatures";

const EMPTY_PATHS: CharacterUpdatePathEntry[] = [];
const EMPTY_FEATURES: CharacterUpdateFeatureEntry[] = [];

export function usePathAndFeaturesStep() {
  const { watch, setValue, formState, clearErrors } =
    useFormContext<CharacterUpdateFormValues>();
  const level = watch("generalInformation.level") ?? 1;
  const ownedPaths = watch("paths") ?? EMPTY_PATHS;
  const ownedFeatures = watch("initialFeatures") ?? EMPTY_FEATURES;
  const pathError =
    (formState.errors.paths?.message as string | undefined) ?? null;
  const [cataloguePaths, setCataloguePaths] = useState<PathOption[]>([]);
  const [catalogueFeatures, setCatalogueFeatures] = useState<
    UnionCatalogueFeature[]
  >([]);
  const [loadingPaths, setLoadingPaths] = useState(true);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [pathToAdd, setPathToAdd] = useState("");

  const unallocatedLevel = getUnallocatedLevel(level, ownedPaths);
  const featureSlots = getFeatureGradeSlots(level);
  const selectedGradeSum = ownedFeatures.reduce(
    (sum, entry) => sum + entry.grade,
    0
  );
  const slotsLeft = featureSlots - selectedGradeSum;
  const isOverAllocated = selectedGradeSum > featureSlots;
  const canAddPath = unallocatedLevel >= 1;

  const ownedPathIds = useMemo(
    () => new Set(ownedPaths.map((path) => path.pathId)),
    [ownedPaths]
  );
  const addablePathOptions = useMemo(
    () =>
      cataloguePaths
        .filter((path) => !ownedPathIds.has(path.id))
        .map((path) => ({
          value: path.id,
          label: formatPathLabel(path.name),
        })),
    [cataloguePaths, ownedPathIds]
  );

  const pathRankKey = ownedPaths
    .map((path) => `${path.pathId}:${path.rank}`)
    .join(",");

  useEffect(() => {
    let cancelled = false;
    setLoadingPaths(true);
    const run = async () => {
      try {
        const response = await fetch("/api/paths");
        const data = (await response.json()) as PathOption[];
        if (!cancelled) setCataloguePaths(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCataloguePaths([]);
      } finally {
        if (!cancelled) setLoadingPaths(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ownedPaths.length === 0) {
      setCatalogueFeatures([]);
      setLoadingFeatures(false);
      return;
    }
    let cancelled = false;
    setLoadingFeatures(true);
    const run = async () => {
      try {
        const results = await Promise.all(
          ownedPaths.map(async (path) => {
            const response = await fetch(
              `/api/paths/${encodeURIComponent(path.pathId)}/available-features?rank=${encodeURIComponent(String(path.rank))}`
            );
            const data = (await response.json()) as UnionCatalogueFeature[];
            return Array.isArray(data) ? data : [];
          })
        );
        if (cancelled) return;
        setCatalogueFeatures(results.flat());
      } catch {
        if (!cancelled) setCatalogueFeatures([]);
      } finally {
        if (!cancelled) setLoadingFeatures(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [pathRankKey, ownedPaths]);

  const setOwnedPaths = (next: CharacterUpdatePathEntry[]) => {
    setValue("paths", next, { shouldDirty: true, shouldValidate: false });
    clearErrors("paths");
  };

  const setOwnedFeatures = (next: CharacterUpdateFeatureEntry[]) => {
    setValue("initialFeatures", next, {
      shouldDirty: true,
      shouldValidate: false,
    });
  };

  const addPath = (pathId: string) => {
    if (!canAddPath || ownedPathIds.has(pathId)) return;
    const cataloguePath = cataloguePaths.find((path) => path.id === pathId);
    if (!cataloguePath) return;
    setOwnedPaths([
      ...ownedPaths,
      { pathId, rank: 1, name: cataloguePath.name },
    ]);
    setPathToAdd("");
  };

  const removePath = (pathId: string) => {
    if (ownedPaths.length <= 1) return;
    const remaining = ownedPaths.filter((path) => path.pathId !== pathId);
    const remainingFeatures = ownedFeatures.filter((feature) =>
      isOwnedFeatureLegal(feature, remaining)
    );
    setOwnedPaths(remaining);
    setOwnedFeatures(remainingFeatures);
  };

  const setPathRank = (pathId: string, rank: number) => {
    setOwnedPaths(
      ownedPaths.map((path) =>
        path.pathId === pathId ? { ...path, rank } : path
      )
    );
  };

  const visibleFeatures = useMemo(
    () =>
      unionCatalogueFeatures({
        catalogue: catalogueFeatures,
        ownedFeatures,
        ownedPaths,
      }),
    [catalogueFeatures, ownedFeatures, ownedPaths]
  );

  const addFeature = (featureId: string) => {
    if (slotsLeft < 1) return;
    const existing = ownedFeatures.find(
      (entry) => entry.featureId === featureId
    );
    const catalogueFeature = visibleFeatures.find(
      (feature) => feature.id === featureId
    );
    const maxGrade = catalogueFeature?.maxGrade ?? existing?.maxGrade ?? 1;
    if (existing) {
      if (existing.grade >= maxGrade) return;
      setOwnedFeatures(
        ownedFeatures.map((entry) =>
          entry.featureId === featureId
            ? { ...entry, grade: entry.grade + 1 }
            : entry
        )
      );
      return;
    }
    if (!catalogueFeature) return;
    setOwnedFeatures([
      ...ownedFeatures,
      {
        featureId,
        grade: 1,
        name: catalogueFeature.name,
        maxGrade: catalogueFeature.maxGrade,
        minPathRank: catalogueFeature.minPathRank,
        applicablePaths: catalogueFeature.applicablePaths,
      },
    ]);
  };

  const setFeatureGrade = (featureId: string, grade: number) => {
    if (grade < 1) {
      setOwnedFeatures(
        ownedFeatures.filter((entry) => entry.featureId !== featureId)
      );
      return;
    }
    const catalogueFeature = visibleFeatures.find(
      (feature) => feature.id === featureId
    );
    const current = ownedFeatures.find(
      (entry) => entry.featureId === featureId
    );
    const maxGrade = catalogueFeature?.maxGrade ?? current?.maxGrade ?? 1;
    const nextGrade = Math.min(maxGrade, Math.max(1, grade));
    const newSum = selectedGradeSum - (current?.grade ?? 0) + nextGrade;
    if (nextGrade > (current?.grade ?? 0) && newSum > featureSlots) return;
    setOwnedFeatures(
      ownedFeatures.map((entry) =>
        entry.featureId === featureId ? { ...entry, grade: nextGrade } : entry
      )
    );
  };

  const illegalOwnedFeatures = ownedFeatures.filter(
    (feature) => !isOwnedFeatureLegal(feature, ownedPaths)
  );
  const illegalOwnedIds = new Set(
    illegalOwnedFeatures.map((feature) => feature.featureId)
  );

  return {
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
  };
}
