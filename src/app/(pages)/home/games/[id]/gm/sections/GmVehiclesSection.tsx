import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { GmSectionTitle } from "./GmSectionTitle";

type GmVehiclesSectionProps = {
  onBrowseCatalogue: () => void;
  onBrowseCustom: () => void;
  onCreateCustom: () => void;
  onCreateUnique: () => void;
  onGiveVehicle: () => void;
};

export function GmVehiclesSection({
  onBrowseCatalogue,
  onBrowseCustom,
  onCreateCustom,
  onCreateUnique,
  onGiveVehicle,
}: GmVehiclesSectionProps) {
  return (
    <InfoCard border>
      <GmSectionTitle>Vehicles</GmSectionTitle>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onBrowseCatalogue}
        >
          Browse vehicles
        </Button>
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onBrowseCustom}
        >
          Browse custom vehicles
        </Button>
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onCreateCustom}
        >
          Create custom vehicle
        </Button>
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onCreateUnique}
        >
          Create unique vehicle
        </Button>
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onGiveVehicle}
        >
          Give vehicle to character
        </Button>
      </div>
    </InfoCard>
  );
}
