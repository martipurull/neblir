import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { GmSectionTitle } from "./GmSectionTitle";

type GmBotsSectionProps = {
  onBrowseCatalogue: () => void;
  onBrowseCustom: () => void;
  onCreateCustom: () => void;
};

export function GmBotsSection({
  onBrowseCatalogue,
  onBrowseCustom,
  onCreateCustom,
}: GmBotsSectionProps) {
  return (
    <InfoCard border>
      <GmSectionTitle>Bots</GmSectionTitle>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onBrowseCatalogue}
        >
          Browse official bots
        </Button>
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onBrowseCustom}
        >
          Browse custom bots
        </Button>
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onCreateCustom}
        >
          Create custom bot
        </Button>
      </div>
    </InfoCard>
  );
}
