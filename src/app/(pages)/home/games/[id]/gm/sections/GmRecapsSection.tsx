import Button from "@/app/components/shared/Button";
import RecapCard from "@/app/components/games/RecapCard";
import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import type { GameRecap } from "@/app/lib/types/recap";
import { GmSectionTitle } from "./GmSectionTitle";

type GmRecapsSectionProps = {
  recaps: GameRecap[];
  loading: boolean;
  error: string | null;
  deletingRecapId: string | null;
  onRetry: () => void;
  onCreateRecap: () => void;
  onDeleteRecap: (recap: GameRecap) => void;
  onDownloadRecap: (recapId: string) => void;
};

export function GmRecapsSection({
  recaps,
  loading,
  error,
  deletingRecapId,
  onRetry,
  onCreateRecap,
  onDeleteRecap,
  onDownloadRecap,
}: GmRecapsSectionProps) {
  return (
    <InfoCard border>
      <GmSectionTitle>Recaps</GmSectionTitle>
      <p className="mt-1 text-sm text-black/70">
        Upload session recap PDFs for players to download.
      </p>
      <div className="mt-3">
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onCreateRecap}
        >
          Upload recap
        </Button>
      </div>
      <div className="mt-4">
        {loading ? (
          <LoadingState text="Loading recaps..." />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : recaps.length === 0 ? (
          <p className="text-sm text-black/70">No recaps uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {recaps.map((recap) => (
              <RecapCard
                key={recap.id}
                recap={recap}
                onDownload={onDownloadRecap}
                canDelete
                deleting={deletingRecapId === recap.id}
                onDelete={onDeleteRecap}
              />
            ))}
          </ul>
        )}
      </div>
    </InfoCard>
  );
}
