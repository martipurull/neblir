"use client";

import { Button } from "@/app/components/shared/Button";
import { NumberField } from "@/app/components/shared/NumberField";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { StoredRichTextHtml } from "@/app/components/shared/StoredRichTextHtml";
import type { CharacterUpdatePathEntry } from "../schemas";
import {
  formatPathLabel,
  parseAtLeastOne,
  type PathOption,
} from "./pathAndFeaturesFormat";

type UpdateOwnedPathsEditorProps = {
  ownedPaths: CharacterUpdatePathEntry[];
  cataloguePaths: PathOption[];
  pathError: string | null;
  unallocatedLevel: number;
  pathToAdd: string;
  addablePathOptions: Array<{ value: string; label: string }>;
  loadingPaths: boolean;
  canAddPath: boolean;
  onPathToAddChange: (value: string) => void;
  onAddPath: (pathId: string) => void;
  onRemovePath: (pathId: string) => void;
  onSetPathRank: (pathId: string, rank: number) => void;
};

export function UpdateOwnedPathsEditor({
  ownedPaths,
  cataloguePaths,
  pathError,
  unallocatedLevel,
  pathToAdd,
  addablePathOptions,
  loadingPaths,
  canAddPath,
  onPathToAddChange,
  onAddPath,
  onRemovePath,
  onSetPathRank,
}: UpdateOwnedPathsEditorProps) {
  return (
    <>
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
                        onSetPathRank(path.pathId, parseAtLeastOne(raw))
                      }
                      className="!w-20 !min-h-8"
                      inputClassName="px-1 py-0.5 text-sm"
                    />
                  </label>
                  <Button
                    type="button"
                    variant="lightChipDangerCompact"
                    fullWidth={false}
                    onClick={() => onRemovePath(path.pathId)}
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
            onPathToAddChange(value);
            onAddPath(value);
          }}
        />
        {loadingPaths && (
          <p className="mt-1 text-xs text-black/60">Loading paths…</p>
        )}
      </div>
    </>
  );
}
