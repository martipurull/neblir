"use client";

import React from "react";

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
          <input
            type="text"
            value={leaveLocationInput}
            onChange={(e) => onLeaveInputChange(e.target.value)}
            placeholder="e.g. Safe house, Car trunk"
            className="rounded border border-white/30 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
            aria-label="Where you left the item"
          />
          <button
            type="button"
            onClick={onLeaveSomewhere}
            disabled={!leaveLocationInput.trim() || isSettingLocation}
            className="rounded border border-white/30 bg-transparent px-3 py-2 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {isSettingLocation ? "Updating…" : "Leave somewhere"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onTakeWithYou}
          disabled={isSettingLocation}
          className="rounded border border-white/30 bg-transparent px-3 py-2 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {isSettingLocation ? "Updating…" : "Take with you"}
        </button>
      )}
      {locationError && (
        <p className="text-sm text-neblirDanger-400">{locationError}</p>
      )}
    </div>
  );
}
