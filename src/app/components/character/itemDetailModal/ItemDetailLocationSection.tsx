"use client";

import { Button } from "@/app/components/shared/Button";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { TextField } from "@/app/components/shared/TextField";
import { useId, useState } from "react";

const NEW_STASH_VALUE = "\u241fnew";

type ItemDetailLocationSectionProps = {
  carried: boolean;
  placeNames: readonly string[];
  onPickPlace: (placeName: string) => void;
  onLeaveSomewhere: (placeName: string) => void;
  onTakeWithYou: () => void;
  isSettingLocation: boolean;
  locationError: string | null;
};

export function ItemDetailLocationSection({
  carried,
  placeNames,
  onPickPlace,
  onLeaveSomewhere,
  onTakeWithYou,
  isSettingLocation,
  locationError,
}: ItemDetailLocationSectionProps) {
  const stashFieldId = useId();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [handledError, setHandledError] = useState(locationError);
  const [prevCarried, setPrevCarried] = useState(carried);
  const hasStashes = placeNames.length > 0;
  const trimmedDraft = draft.trim();
  const canLeave = trimmedDraft !== "";

  if (locationError !== handledError) {
    setHandledError(locationError);
    if (locationError && hasStashes) {
      setCreating(false);
      setDraft("");
    }
  }

  if (carried !== prevCarried) {
    setPrevCarried(carried);
    if (carried) {
      setCreating(false);
      setDraft("");
    }
  }

  const showNameField = carried && (!hasStashes || creating);

  const leaveNewStash = () => {
    if (!canLeave || isSettingLocation) return;
    onLeaveSomewhere(trimmedDraft);
  };

  return (
    <div className="mt-3 flex flex-col gap-2 rounded border border-white/20 p-3">
      <span className="block text-xs font-medium uppercase tracking-wider text-white/70">
        Change location
      </span>
      {carried ? (
        <div className="flex flex-col gap-2">
          {hasStashes ? (
            <div className={menuOpen ? "min-h-[19rem]" : undefined}>
              <span
                className="mb-1 block text-sm font-medium text-white"
                aria-hidden="true"
              >
                Stash
              </span>
              <SelectDropdown
                id={stashFieldId}
                label="Stash"
                showLabel={false}
                placeholder="Choose a stash"
                value={creating ? NEW_STASH_VALUE : ""}
                options={[
                  { value: "", label: "Choose a stash" },
                  ...placeNames.map((placeName) => ({
                    value: placeName,
                    label: placeName,
                  })),
                  { value: NEW_STASH_VALUE, label: "New stash…" },
                ]}
                disabled={isSettingLocation}
                sortOptions={false}
                onOpenChange={setMenuOpen}
                onChange={(value) => {
                  if (value === NEW_STASH_VALUE) {
                    setCreating(true);
                    return;
                  }
                  setCreating(false);
                  setDraft("");
                  if (value === "") return;
                  onPickPlace(value);
                }}
              />
            </div>
          ) : null}
          {showNameField ? (
            <TextField
              type="text"
              variant="dark"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                leaveNewStash();
              }}
              placeholder="Stash name"
              className="text-sm"
              aria-label="Stash name"
              disabled={isSettingLocation}
            />
          ) : null}
          {showNameField ? (
            <Button
              type="button"
              variant="modalSubtleWhiteBorderBlock"
              fullWidth={false}
              onClick={leaveNewStash}
              disabled={isSettingLocation || !canLeave}
            >
              {isSettingLocation ? "Updating…" : "Leave somewhere"}
            </Button>
          ) : null}
          {isSettingLocation && !showNameField ? (
            <p className="text-sm text-white/70">Updating…</p>
          ) : null}
        </div>
      ) : (
        <Button
          type="button"
          variant="modalSubtleWhiteBorderBlock"
          fullWidth={false}
          onClick={onTakeWithYou}
          disabled={isSettingLocation}
        >
          {isSettingLocation ? "Updating…" : "Take with you"}
        </Button>
      )}
      {locationError ? (
        <p className="text-sm text-neblirDanger-400">{locationError}</p>
      ) : null}
    </div>
  );
}
