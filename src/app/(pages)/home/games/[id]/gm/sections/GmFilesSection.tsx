import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { GameFileCard } from "@/app/components/games/GameFileCard";
import type { GameFile } from "@/app/lib/types/gameFile";
import { useGameFileUrls } from "@/hooks/use-game-file-urls";
import { GmSectionTitle } from "./GmSectionTitle";

type GmFilesSectionProps = {
  files: GameFile[];
  loading: boolean;
  error: string | null;
  deletingFileId: string | null;
  onRetry: () => void;
  onCreateFile: () => void;
  onDeleteFile: (file: GameFile) => void;
  onOpenFile: (file: GameFile) => void;
  onDownloadFile: (file: GameFile) => void;
};

export function GmFilesSection({
  files,
  loading,
  error,
  deletingFileId,
  onRetry,
  onCreateFile,
  onDeleteFile,
  onOpenFile,
  onDownloadFile,
}: GmFilesSectionProps) {
  const fileUrls = useGameFileUrls(
    files.filter((file) => file.kind === "IMAGE")
  );

  return (
    <InfoCard border>
      <GmSectionTitle>Files</GmSectionTitle>
      <p className="mt-1 text-sm text-black/70">
        Upload images and PDFs for players to view and download.
      </p>
      <div className="mt-3">
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onCreateFile}
        >
          Upload file
        </Button>
      </div>
      <div className="mt-4">
        {loading ? (
          <LoadingState text="Loading files..." />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : files.length === 0 ? (
          <p className="text-sm text-black/70">No files uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <GameFileCard
                key={file.id}
                file={file}
                fileUrl={fileUrls[file.id]}
                canDelete
                deleting={deletingFileId === file.id}
                onDelete={onDeleteFile}
                onOpen={onOpenFile}
                onDownload={onDownloadFile}
              />
            ))}
          </ul>
        )}
      </div>
    </InfoCard>
  );
}
