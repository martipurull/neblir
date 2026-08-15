"use client";

import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import { PageTitle } from "@/app/components/shared/PageTitle";
import { CreateGameFileModal } from "@/app/components/games/CreateGameFileModal";
import { GameFileCard } from "@/app/components/games/GameFileCard";
import type { GameFile } from "@/app/lib/types/gameFile";
import { useGame } from "@/hooks/use-game";
import { useGameFileUrls } from "@/hooks/use-game-file-urls";
import { useGameFiles } from "@/hooks/use-game-files";
import { deleteGameFile, getGameFileUrl } from "@/lib/api/gameFiles";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function GameFilesPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game } = useGame(id);
  const { files, loading, error, refetch } = useGameFiles(id);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileEditTarget, setFileEditTarget] = useState<GameFile | null>(null);
  const fileUrls = useGameFileUrls(
    files.filter((file) => file.kind === "IMAGE")
  );
  const isGameMaster = game?.isGameMaster === true;

  const handleOpen = async (file: GameFile) => {
    const url = await getGameFileUrl(file.id, "inline");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (file: GameFile) => {
    const url = await getGameFileUrl(file.id, "attachment");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!id) {
    return (
      <PageSection>
        <ErrorState message="Game not found" />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <PageTitle>Files</PageTitle>
            {game ? (
              <p className="mt-1 text-sm text-black/70">
                Images and PDFs for{" "}
                <span className="font-semibold">{game.name}</span>
              </p>
            ) : null}
          </div>
          {isGameMaster && game ? (
            <Button
              type="button"
              variant="solidDark"
              fullWidth={false}
              onClick={() => {
                setFileEditTarget(null);
                setFileModalOpen(true);
              }}
            >
              Upload file
            </Button>
          ) : null}
        </div>
        {loading ? (
          <LoadingState text="Loading files..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void refetch()} />
        ) : files.length === 0 ? (
          <p className="text-sm text-black/70">No files uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <GameFileCard
                key={file.id}
                file={file}
                fileUrl={fileUrls[file.id]}
                canDelete={isGameMaster}
                canEdit={isGameMaster}
                showAccessBadge={isGameMaster}
                deleting={deletingFileId === file.id}
                onOpen={(entry) => void handleOpen(entry)}
                onDownload={(entry) => void handleDownload(entry)}
                onEdit={(entry) => {
                  setFileEditTarget(entry);
                  setFileModalOpen(true);
                }}
                onDelete={(entry) => {
                  if (
                    !window.confirm(
                      `Delete file "${entry.title}"? This cannot be undone.`
                    )
                  ) {
                    return;
                  }
                  setDeletingFileId(entry.id);
                  void deleteGameFile(id, entry.id)
                    .then(async () => {
                      await refetch();
                    })
                    .finally(() => {
                      setDeletingFileId(null);
                    });
                }}
              />
            ))}
          </ul>
        )}
      </div>
      {game ? (
        <CreateGameFileModal
          key={fileEditTarget?.id ?? "create"}
          isOpen={fileModalOpen}
          gameId={game.id}
          gameName={game.name}
          mode={fileEditTarget ? "edit" : "create"}
          file={fileEditTarget}
          onClose={() => {
            setFileModalOpen(false);
            setFileEditTarget(null);
          }}
          onSuccess={() => {
            setFileEditTarget(null);
            void refetch();
          }}
        />
      ) : null}
    </PageSection>
  );
}
