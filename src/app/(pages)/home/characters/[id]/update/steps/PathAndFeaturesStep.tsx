"use client";

import { ExpandableClamp } from "@/app/components/shared/ExpandableClamp";
import { StoredRichTextHtml } from "@/app/components/shared/StoredRichTextHtml";
import { Button } from "@/app/components/shared/Button";
import { NumberField } from "@/app/components/shared/NumberField";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import type { PathName } from "@prisma/client";
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

type PathOption = {
  id: string;
  name: PathName;
  description: string | null;
  baseFeature: string;
};

type FeatureOption = {
  id: string;
  name: string;
  maxGrade: number;
  minPathRank: number;
  description?: string | null;
  applicablePaths: PathName[];
};

const EMPTY_PATHS: CharacterUpdatePathEntry[] = [];
const EMPTY_FEATURES: CharacterUpdateFeatureEntry[] = [];

function formatPathLabel(name: string): string {
  return name.replace(/_/g, " ");
}

function parseRank(raw: string): number {
  return Math.max(1, parseInt(raw, 10) || 1);
}

export function PathAndFeaturesStep() {
  const { watch, setValue, formState, clearErrors } =
    useFormContext<CharacterUpdateFormValues>();
  const level = watch("generalInformation.level") ?? 1;
  const ownedPaths = watch("paths") ?? EMPTY_PATHS;
  const ownedFeatures = watch("initialFeatures") ?? EMPTY_FEATURES;
  const pathError =
    (formState.errors.paths?.message as string | undefined) ?? null;
  const [cataloguePaths, setCataloguePaths] = useState<PathOption[]>([]);
  const [catalogueFeatures, setCatalogueFeatures] = useState<FeatureOption[]>(
    []
  );
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
            const data = (await response.json()) as FeatureOption[];
            return Array.isArray(data) ? data : [];
          })
        );
        if (cancelled) return;
        const byId = new Map<string, FeatureOption>();
        for (const feature of results.flat()) {
          if (!byId.has(feature.id)) byId.set(feature.id, feature);
        }
        const sorted = [...byId.values()].sort((a, b) =>
          (a.name ?? "").localeCompare(b.name ?? "")
        );
        setCatalogueFeatures(sorted);
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

  const addFeature = (featureId: string) => {
    if (slotsLeft < 1) return;
    const existing = ownedFeatures.find(
      (entry) => entry.featureId === featureId
    );
    const feat = catalogueFeatures.find((feature) => feature.id === featureId);
    const maxGrade = feat?.maxGrade ?? existing?.maxGrade ?? 1;
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
    if (!feat) return;
    setOwnedFeatures([
      ...ownedFeatures,
      {
        featureId,
        grade: 1,
        name: feat.name,
        maxGrade: feat.maxGrade,
        minPathRank: feat.minPathRank,
        applicablePaths: feat.applicablePaths,
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
    const feat = catalogueFeatures.find((feature) => feature.id === featureId);
    const current = ownedFeatures.find(
      (entry) => entry.featureId === featureId
    );
    const maxG = feat?.maxGrade ?? current?.maxGrade ?? 1;
    const nextGrade = Math.min(maxG, Math.max(1, grade));
    const currentSum = ownedFeatures.reduce(
      (sum, entry) => sum + entry.grade,
      0
    );
    const newSum = currentSum - (current?.grade ?? 0) + nextGrade;
    if (nextGrade > (current?.grade ?? 0) && newSum > featureSlots) return;
    setOwnedFeatures(
      ownedFeatures.map((entry) =>
        entry.featureId === featureId ? { ...entry, grade: nextGrade } : entry
      )
    );
  };

  const catalogueById = useMemo(
    () => new Map(catalogueFeatures.map((feature) => [feature.id, feature])),
    [catalogueFeatures]
  );
  const illegalOwnedFeatures = ownedFeatures.filter(
    (feature) => !isOwnedFeatureLegal(feature, ownedPaths)
  );
  const pendingOwnedFeatures = ownedFeatures.filter(
    (feature) =>
      isOwnedFeatureLegal(feature, ownedPaths) &&
      !catalogueById.has(feature.featureId)
  );
  const illegalOwnedIds = new Set(
    illegalOwnedFeatures.map((feature) => feature.featureId)
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-black/70">
        Edit every path and its rank. Unallocated level must be 0 before saving
        (ranks sum to level). You may choose features using a total of up to{" "}
        <strong>{featureSlots}</strong> grade slots (2 slots per level above 1).
      </p>

      <div
        className={`rounded-md border px-3 py-2 text-sm font-semibold ${
          unallocatedLevel === 0
            ? "border-black/20 bg-paleBlue text-black"
            : "border-neblirDanger-600 bg-neblirDanger-200/30 text-neblirDanger"
        }`}
        role={unallocatedLevel === 0 ? "status" : "alert"}
      >
        Unallocated level: {unallocatedLevel}
      </div>
      {pathError && (
        <p className="text-sm text-neblirDanger-600" role="alert">
          {pathError}
        </p>
      )}

      <div className="space-y-3">
        {ownedPaths.length === 0 && (
          <p className="text-sm text-black/60">
            This character has no paths. Add a path to continue.
          </p>
        )}
        {ownedPaths.map((path) => {
          const cataloguePath = cataloguePaths.find(
            (option) => option.id === path.pathId
          );
          const label = formatPathLabel(path.name ?? cataloguePath?.name ?? "");
          return (
            <div
              key={path.pathId}
              className="rounded border border-black/20 bg-black/5 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-black">
                    {label || path.pathId}
                  </p>
                  {cataloguePath?.baseFeature ? (
                    <StoredRichTextHtml
                      content={cataloguePath.baseFeature}
                      className="mt-1 text-sm text-black/90"
                    />
                  ) : null}
                </div>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    Rank
                    <NumberField
                      id={`path-rank-${path.pathId}`}
                      min={1}
                      value={path.rank}
                      stepperLabel={`${label || "Path"} rank`}
                      onChange={(raw) =>
                        setPathRank(path.pathId, parseRank(raw))
                      }
                      className="!w-20 !min-h-8"
                      inputClassName="px-1 py-0.5 text-sm"
                    />
                  </label>
                  <Button
                    type="button"
                    variant="lightChipDangerCompact"
                    fullWidth={false}
                    onClick={() => removePath(path.pathId)}
                    disabled={ownedPaths.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              {cataloguePath?.description ? (
                <StoredRichTextHtml
                  content={cataloguePath.description}
                  className="mt-2 text-sm text-black/70"
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mx-auto max-w-2xl">
        <SelectDropdown
          id="add-path"
          label="Add path"
          placeholder={
            loadingPaths
              ? "Loading paths…"
              : canAddPath
                ? "Select a path to add"
                : "No unallocated level to add a path"
          }
          value={pathToAdd}
          options={addablePathOptions}
          disabled={
            loadingPaths || !canAddPath || addablePathOptions.length === 0
          }
          onChange={(value) => {
            setPathToAdd(value);
            addPath(value);
          }}
        />
        {loadingPaths && (
          <p className="mt-1 text-xs text-black/60">Loading paths…</p>
        )}
      </div>

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
                onClick={() => setFeatureGrade(feature.featureId, 0)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {pendingOwnedFeatures.map((feature) => (
        <div
          key={feature.featureId}
          className="flex flex-wrap items-center gap-2 rounded border border-neblirSafe-400 p-2"
        >
          <span className="font-medium">
            {feature.name ?? feature.featureId}
          </span>
          <span className="text-xs text-black/60">(grade {feature.grade})</span>
        </div>
      ))}

      {ownedPaths.length > 0 && level <= 1 && ownedFeatures.length === 0 && (
        <p className="text-sm text-black/60">
          At level 1 you don’t pick additional features yet.
        </p>
      )}

      {ownedPaths.length > 0 && (level > 1 || ownedFeatures.length > 0) && (
        <div className="space-y-2">
          {loadingFeatures && (
            <p className="text-sm text-black/60">Loading features…</p>
          )}
          {!loadingFeatures &&
            catalogueFeatures.length === 0 &&
            ownedFeatures.length === 0 && (
              <p className="text-sm text-black/60">
                No features available for the current paths and ranks.
              </p>
            )}
          {!loadingFeatures && catalogueFeatures.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {catalogueFeatures.map((feature) => {
                const selected = ownedFeatures.find(
                  (entry) => entry.featureId === feature.id
                );
                const desc = feature.description ?? "";
                return (
                  <div
                    key={feature.id}
                    className={`flex flex-wrap items-center gap-2 rounded border p-2 ${
                      selected
                        ? illegalOwnedIds.has(feature.id)
                          ? "border-neblirDanger-600"
                          : "border-neblirSafe-400"
                        : "border-black/20"
                    }`}
                  >
                    <span className="font-medium">{feature.name}</span>
                    <span className="text-xs text-black/60">
                      (grade 1–{feature.maxGrade})
                    </span>
                    {desc.trim().length > 0 && (
                      <div className="w-full">
                        <ExpandableClamp
                          contentClassName="mt-1 text-xs text-black/70"
                          clampClassName="max-h-12 overflow-hidden"
                          measureKey={desc}
                        >
                          <StoredRichTextHtml
                            content={desc}
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
                        onClick={() => addFeature(feature.id)}
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
                              setFeatureGrade(feature.id, parseRank(raw))
                            }
                            className="!w-14 !min-h-8"
                            inputClassName="px-1 py-0.5 text-sm"
                          />
                        </label>
                        <Button
                          type="button"
                          variant="lightChipDangerCompact"
                          fullWidth={false}
                          onClick={() =>
                            setFeatureGrade(feature.id, selected.grade - 1)
                          }
                        >
                          - Grade
                        </Button>
                        <Button
                          type="button"
                          variant="lightChipSafeCompact"
                          fullWidth={false}
                          onClick={() => addFeature(feature.id)}
                          disabled={
                            selected.grade >= feature.maxGrade || slotsLeft < 1
                          }
                        >
                          + Grade
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
