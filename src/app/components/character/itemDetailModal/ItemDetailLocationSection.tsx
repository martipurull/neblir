"use client";

import { Button } from "@/app/components/shared/Button";
import { TextField } from "@/app/components/shared/TextField";

type ItemDetailLocationSectionProps = {
  carried: boolean;
  placeNames: readonly string[];
  leaveLocationInput: string;
  onLeaveInputChange: (value: string) => void;
  onPickPlace: (placeName: string) => void;
  onLeaveSomewhere: () => void;
  onTakeWithYou: () => void;
  isSettingLocation: boolean;
  locationError: string | null;
};

export function ItemDetailLocationSection({
  carried,
  placeNames,
  leaveLocationInput,
  onLeaveInputChange,
  onPickPlace,
  onLeaveSomewhere,
  onTakeWithYou,
  isSettingLocation,
  locationError,
}: ItemDetailLocationSectionProps) {
  return (
    <div className="mt-3 flex flex-col gap-2 rounded border border-white/20 p-3">
      <span className="block text-xs font-medium uppercase tracking-wider text-white/70">
        Change location
      </span>
      {carried ? (
        <div className="flex flex-col gap-2">
          {placeNames.length > 0 ? (
            <ul
              aria-label="Places"
              className="flex max-h-40 flex-col gap-1 overflow-y-auto"
            >
              {placeNames.map((placeName) => (
                <li key={placeName}>
                  <Button
                    type="button"
                    variant="modalBrowseListRow"
                    onClick={() => onPickPlace(placeName)}
                    disabled={isSettingLocation}
                  >
                    {placeName}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          <TextField
            type="text"
            variant="dark"
            value={leaveLocationInput}
            onChange={(e) => onLeaveInputChange(e.target.value)}
            placeholder="Type a new place"
            className="text-sm"
            aria-label="New place name"
          />
          <Button
            type="button"
            variant="modalSubtleWhiteBorderBlock"
            fullWidth={false}
            onClick={onLeaveSomewhere}
            disabled={isSettingLocation}
          >
            {isSettingLocation ? "Updating…" : "Leave somewhere"}
          </Button>
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
      {locationError && (
        <p className="text-sm text-neblirDanger-400">{locationError}</p>
      )}
    </div>
  );
}
