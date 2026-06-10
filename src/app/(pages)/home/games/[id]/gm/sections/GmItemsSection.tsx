import { Button } from "@/app/components/shared/Button";
import { appButtonVariantClassName } from "@/app/components/shared/buttonStyles";
import { InfoCard } from "@/app/components/shared/InfoCard";
import Link from "next/link";
import { GmSectionTitle } from "./GmSectionTitle";

type GmItemsSectionProps = {
  gameId: string;
  onCreateCustom: () => void;
  onCreateUnique: () => void;
  onGiveItem: () => void;
};

export function GmItemsSection({
  gameId,
  onCreateCustom,
  onCreateUnique,
  onGiveItem,
}: GmItemsSectionProps) {
  return (
    <InfoCard border>
      <GmSectionTitle>Items</GmSectionTitle>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/home/games/${gameId}/custom-items`}
          className={`inline-block ${appButtonVariantClassName.primarySm}`}
        >
          Browse custom items
        </Link>
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
