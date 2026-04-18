import Button from "@/app/components/shared/Button";
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
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onCreateCustom}
        >
          Create custom item
        </Button>
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onCreateUnique}
        >
          Create unique item
        </Button>
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onGiveItem}
        >
          Give item to character
        </Button>
      </div>
    </InfoCard>
  );
}
