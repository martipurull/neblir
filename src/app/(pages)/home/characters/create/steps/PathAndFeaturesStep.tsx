"use client";

import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

type PathOption = {
  id: string;
  name: string;
  description: string | null;
  baseFeature: string;
};
type FeatureOption = {
  id: string;
  name: string;
  maxGrade: number;
  minPathRank: number;
  description?: string | null;
};

export type InitialFeatureEntry = { featureId: string; grade: number };

interface PathAndFeaturesStepProps {
  onInitialFeaturesChange?: (features: InitialFeatureEntry[]) => void;
  initialFeatures?: InitialFeatureEntry[];
}

export function PathAndFeaturesStep({
  onInitialFeaturesChange,
  initialFeatures,
}: PathAndFeaturesStepProps) {
  const { control, watch, setValue } =
    useFormContext<CharacterCreationRequest>();
  const level = watch("generalInformation.level") ?? 1;
  const pathId = watch("path.pathId");
  const [paths, setPaths] = useState<PathOption[]>([]);
  const [features, setFeatures] = useState<FeatureOption[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<
    InitialFeatureEntry[]
  >(initialFeatures ?? []);
  const [loadingPaths, setLoadingPaths] = useState(true);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [expandedFeatureDescriptions, setExpandedFeatureDescriptions] =
    useState<Record<string, boolean>>({});

  useEffect(() => {
    onInitialFeaturesChange?.(selectedFeatures);
  }, [selectedFeatures, onInitialFeaturesChange]);

  useEffect(() => {
    if (pathId) setValue("path.rank", level);
  }, [pathId, level, setValue]);

  // When we hydrate initial features (refresh), we want to show them once
  // the step mounts. This also keeps the UI synced with controller state.
  const hydratedRef = useRef(false);
  const prevPathIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // When rehydrating from localStorage, seed the UI with the saved selection.
    setSelectedFeatures(initialFeatures ?? []);
    hydratedRef.current = true;
  }, [initialFeatures]);

  // Requirement: when the user changes path, previously selected features
  // should be unselected.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (
      prevPathIdRef.current !== undefined &&
      prevPathIdRef.current !== pathId
    ) {
      setSelectedFeatures([]);
    }
    prevPathIdRef.current = pathId;
  }, [pathId]);

  useEffect(() => {
    let cancelled = false;
    setLoadingPaths(true);
    const run = async () => {
      try {
        const r = await fetch("/api/paths");
        const data = (await r.json()) as PathOption[];
        if (!cancelled) setPaths(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setPaths([]);
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
    if (!pathId || !level) {
      setFeatures([]);
      setSelectedFeatures([]);
      return;
    }
    let cancelled = false;
    setLoadingFeatures(true);
    const run = async () => {
      try {
        const r = await fetch(
          `/api/paths/${encodeURIComponent(pathId)}/available-features?rank=${encodeURIComponent(level)}`
        );
        const data = (await r.json()) as FeatureOption[];
        if (!cancelled) {
          const sorted = Array.isArray(data)
            ? data
                .slice()
                .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
            : [];
          setFeatures(sorted);
        }
      } catch {
        if (!cancelled) setFeatures([]);
      } finally {
        if (!cancelled) setLoadingFeatures(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [pathId, level]);

  const featureSlots = Math.max(0, 2 * (level - 1));
  const selectedGradeSum = selectedFeatures.reduce((s, e) => s + e.grade, 0);
  const slotsLeft = featureSlots - selectedGradeSum;

  // Ensure hydrated selections remain valid for the current path/rank.
  useEffect(() => {
    if (!features || features.length === 0) return;

    setSelectedFeatures((prev) => {
      const byId = new Map(features.map((f) => [f.id, f] as const));
      const next = prev
        .map((e) => {
          const f = byId.get(e.featureId);
          if (!f) return null;
          const clamped = Math.min(f.maxGrade, Math.max(1, e.grade));
          return { featureId: e.featureId, grade: clamped };
        })
        .filter((e): e is InitialFeatureEntry => e !== null);

      return next;
    });
  }, [features]);

  const toggleExpandedDescription = (featureId: string) => {
    setExpandedFeatureDescriptions((prev) => ({
      ...prev,
      [featureId]: !prev[featureId],
    }));
  };

  const addFeature = (featureId: string) => {
    if (slotsLeft < 1) return;
    const existing = selectedFeatures.find((e) => e.featureId === featureId);
    const feat = features.find((f) => f.id === featureId);
    const maxGrade = feat?.maxGrade ?? 1;
    if (existing) {
      if (existing.grade >= maxGrade) return;
      setSelectedFeatures((prev) =>
        prev.map((e) =>
          e.featureId === featureId ? { ...e, grade: e.grade + 1 } : e
        )
      );
    } else {
      setSelectedFeatures((prev) => [...prev, { featureId, grade: 1 }]);
    }
  };

  const setFeatureGrade = (featureId: string, grade: number) => {
    if (grade < 1) {
      setSelectedFeatures((prev) =>
        prev.filter((e) => e.featureId !== featureId)
      );
      return;
    }
    const feat = features.find((f) => f.id === featureId);
    const maxG = feat?.maxGrade ?? 1;
    const g = Math.min(maxG, Math.max(1, grade));
    const current = selectedFeatures.find((e) => e.featureId === featureId);
    const currentSum = selectedFeatures.reduce((s, e) => s + e.grade, 0);
    const newSum = currentSum - (current?.grade ?? 0) + g;
    if (newSum > featureSlots) return;
    setSelectedFeatures((prev) => {
      const rest = prev.filter((e) => e.featureId !== featureId);
      return g > 0 ? [...rest, { featureId, grade: g }] : rest;
    });
  };

  const removeFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.filter((e) => e.featureId !== featureId)
    );
  };

  const selectedPath = pathId ? paths.find((p) => p.id === pathId) : null;
  const pathOptions = useMemo(
    () =>
      paths.map((p) => ({
        value: p.id,
        label: p.name.replace(/_/g, " "),
      })),
    [paths]
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-black/70">
        Select a path. Rank is set to your character level. You may choose
        features using a total of up to <strong>{featureSlots}</strong> grade
        slots (2 slots per level above 1).
      </p>

      <div className="mb-6">
        <Controller
          name="path.pathId"
          control={control}
          render={({ field }) => (
            <SelectDropdown
              id="path.pathId"
              label="Path"
              placeholder={loadingPaths ? "Loading paths…" : "Select a path"}
              value={field.value ?? ""}
              options={pathOptions}
              disabled={loadingPaths}
              onChange={(value) => {
                field.onChange(value);
                setValue("path.rank", level);
              }}
            />
          )}
        />
        {loadingPaths && (
          <p className="mt-1 text-xs text-black/60">Loading paths…</p>
        )}
        {selectedPath && (
          <div className="mt-2 rounded border border-black/20 bg-black/5 p-2 text-sm">
            <p className="font-medium">
              Base feature: {selectedPath.baseFeature}
            </p>
            {selectedPath.description && (
              <p className="mt-1 text-black/70">{selectedPath.description}</p>
            )}
          </div>
        )}
      </div>

      <Controller
        name="path.rank"
        control={control}
        render={({ field }) => <input type="hidden" {...field} />}
      />

      {pathId && level <= 1 && (
        <p className="text-sm text-black/60">
          At level 1 you don’t pick additional features yet.
        </p>
      )}

      {pathId && level > 1 && (
        <div className="space-y-2">
          <div className="sticky top-2 z-10 flex justify-end">
            <div className="rounded-md border border-black/20 bg-white/60 px-3 py-2 text-sm font-semibold text-black shadow-sm backdrop-blur">
              Slots used: {selectedGradeSum} / {featureSlots}
            </div>
          </div>
          {loadingFeatures && (
            <p className="text-sm text-black/60">Loading features…</p>
          )}
          {!loadingFeatures && features.length === 0 && (
            <p className="text-sm text-black/60">
              No features available for this path and rank.
            </p>
          )}
          {!loadingFeatures &&
            features.map((f) => {
              const sel = selectedFeatures.find((e) => e.featureId === f.id);
              const desc = f.description ?? "";
              const isExpandedDesc = !!expandedFeatureDescriptions[f.id];
              return (
                <div
                  key={f.id}
                  className={`flex flex-wrap items-center gap-2 rounded border p-2 ${
                    sel ? "border-neblirSafe-400" : "border-black/20"
                  }`}
                >
                  <span className="font-medium">{f.name}</span>
                  <span className="text-xs text-black/60">
                    (grade 1–{f.maxGrade})
                  </span>

                  {desc.trim().length > 0 && (
                    <div className="w-full">
                      <div
                        className="mt-1 text-xs text-black/70"
                        style={{
                          maxHeight: isExpandedDesc ? 96 : 48,
                          overflowY: isExpandedDesc ? "auto" : "hidden",
                        }}
                      >
                        {desc}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpandedDescription(f.id)}
                        className="mt-1 text-[10px] font-medium text-black/50 underline"
                        disabled={!(desc.trim().length > 120)}
                      >
                        {isExpandedDesc ? "Show less" : "Show more"}
                      </button>
                    </div>
                  )}
                  {!sel ? (
                    <button
                      type="button"
                      onClick={() => addFeature(f.id)}
                      disabled={slotsLeft < 1}
                      className="rounded border border-black/40 px-2 py-1 text-sm hover:bg-black/10 disabled:opacity-50"
                    >
                      + Add (grade 1)
                    </button>
                  ) : (
                    <>
                      <label className="text-sm">
                        Grade:
                        <input
                          type="number"
                          min={1}
                          max={f.maxGrade}
                          value={sel.grade}
                          onChange={(e) =>
                            setFeatureGrade(
                              f.id,
                              Math.max(1, parseInt(e.target.value, 10) || 1)
                            )
                          }
                          className="ml-1 w-14 rounded border border-black/30 px-1 py-0.5 text-sm"
                        />
                      </label>
                      {sel.grade < f.maxGrade && slotsLeft >= 1 && (
                        <button
                          type="button"
                          onClick={() => addFeature(f.id)}
                          className="rounded border border-black/40 px-2 py-1 text-xs hover:bg-black/10"
                        >
                          + Grade
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFeature(f.id)}
                        className="text-xs text-neblirDanger-600 underline"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
