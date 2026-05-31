"use client";

import { Button } from "@/app/components/shared/Button";
import { TextField } from "@/app/components/shared/TextField";
type ItemDetailLocationSectionProps = {
  carried: boolean;
  leaveLocationInput: string;
  onLeaveInputChange: (value: string) => void;
  onLeaveSomewhere: () => void;
  onTakeWithYou: () => void;
  isSettingLocation: boolean;
  locationError: string | null;
};

export function ItemDetailLocationSection({
  carried,
  leaveLocationInput,
  onLeaveInputChange,
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
          <TextField
            type="text"
            variant="dark"
            value={leaveLocationInput}
            onChange={(e) => onLeaveInputChange(e.target.value)}
            placeholder="e.g. Safe house, Car trunk"
            className="text-sm"
            aria-label="Where you left the item"
          />
          <Button
            type="button"
            variant="modalSubtleWhiteBorderBlock"
            fullWidth={false}
            onClick={onLeaveSomewhere}
            disabled={!leaveLocationInput.trim() || isSettingLocation}
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
