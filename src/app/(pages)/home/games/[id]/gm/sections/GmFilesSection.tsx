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
  onEditFile: (file: GameFile) => void;
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
  onEditFile,
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
        Upload images and PDFs. Mark each file as player-visible or GM only.
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
                canEdit
                showAccessBadge
                deleting={deletingFileId === file.id}
                onEdit={onEditFile}
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
