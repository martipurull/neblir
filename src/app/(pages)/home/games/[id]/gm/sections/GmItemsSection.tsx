import InfoCard from "@/app/components/shared/InfoCard";
import React from "react";
import { GmSectionTitle } from "./GmSectionTitle";

type GmItemsSectionProps = {
  onCreateCustom: () => void;
  onCreateUnique: () => void;
  onGiveItem: () => void;
};

export function GmItemsSection({
  onCreateCustom,
  onCreateUnique,
  onGiveItem,
}: GmItemsSectionProps) {
  return (
    <InfoCard border>
      <GmSectionTitle>Items</GmSectionTitle>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCreateCustom}
          className="rounded-md bg-customPrimary px-4 py-2 text-sm font-medium text-customSecondary hover:bg-customPrimaryHover"
        >
          Create custom item
        </button>
        <button
          type="button"
          onClick={onCreateUnique}
          className="rounded-md bg-customPrimary px-4 py-2 text-sm font-medium text-customSecondary hover:bg-customPrimaryHover"
        >
          Create unique item
        </button>
        <button
          type="button"
          onClick={onGiveItem}
          className="rounded-md bg-customPrimary px-4 py-2 text-sm font-medium text-customSecondary hover:bg-customPrimaryHover"
        >
          Give item to character
        </button>
      </div>
    </InfoCard>
  );
}
