"use client";

import { CreateGameFileModal } from "@/app/components/games/CreateGameFileModal";
import { CreateGameLoreEntryModal } from "@/app/components/games/CreateGameLoreEntryModal";
import { CreateGameRecapModal } from "@/app/components/games/CreateGameRecapModal";
import { InviteUsersModal } from "@/app/components/games/InviteUsersModal";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import { PageTitle } from "@/app/components/shared/PageTitle";
import type { GameFile } from "@/app/lib/types/gameFile";
import type { GameRecap } from "@/app/lib/types/recap";
import type { ReferenceEntry } from "@/app/lib/types/reference";
import { useGame } from "@/hooks/use-game";
import { useGameFiles } from "@/hooks/use-game-files";
import { useGameRecaps } from "@/hooks/use-game-recaps";
import { useReferenceEntries } from "@/hooks/use-reference-entries";
import { deleteGameFile, getGameFileUrl } from "@/lib/api/gameFiles";
import { deleteGameRecap, getRecapDownloadUrl } from "@/lib/api/recaps";
import { deleteReferenceEntry } from "@/lib/api/referenceEntries";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import {
  GmCoverImageSection,
  GmDangerZoneSection,
  GmDiscordSection,
  GmFilesSection,
  GmInvitesSection,
  GmLoreSection,
  GmPlayersSection,
  GmPremiseSection,
  GmRecapsSection,
} from "../sections";

type PendingInvite = {
  invitedUserId: string;
  invitedUserName: string;
  invitedUserEmail: string;
  createdAt: string;
};

export function GameMasterTableSettingsPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;
  const discordGuildId = searchParams.get("discordGuildId");
  const { game, loading, error, refetch, mutate } = useGame(id);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [loreEntryModalOpen, setLoreEntryModalOpen] = useState(false);
  const [recapModalOpen, setRecapModalOpen] = useState(false);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [loreEntryEditTarget, setLoreEntryEditTarget] =
    useState<ReferenceEntry | null>(null);
  const [recapEditTarget, setRecapEditTarget] = useState<GameRecap | null>(
    null
  );
  const [fileEditTarget, setFileEditTarget] = useState<GameFile | null>(null);
  const [deletingLoreEntryId, setDeletingLoreEntryId] = useState<string | null>(
    null
  );
  const [deletingRecapId, setDeletingRecapId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const { data: pendingInvites = [], mutate: mutatePendingInvites } = useSWR<
    PendingInvite[]
  >(
    game?.isGameMaster && id
      ? `/api/games/${encodeURIComponent(id)}/invites`
      : null
  );
  const {
    entries: loreEntries,
    loading: loreEntriesLoading,
    error: loreEntriesError,
    refetch: refetchLoreEntries,
  } = useReferenceEntries({
    category: "CAMPAIGN_LORE",
    gameId: id ?? undefined,
  });
  const {
    recaps,
    loading: recapsLoading,
    error: recapsError,
    refetch: refetchRecaps,
  } = useGameRecaps(id);
  const {
    files,
    loading: filesLoading,
    error: filesError,
    refetch: refetchFiles,
  } = useGameFiles(id);

  if (loading || (!game && !error)) {
    return (
      <PageSection>
        <LoadingState text="Loading..." />
      </PageSection>
    );
  }

  if (error || !game) {
    return (
      <PageSection>
        <ErrorState
          message={error ?? "Game not found"}
          onRetry={refetch}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  if (!game.isGameMaster) {
    return (
      <PageSection>
        <ErrorState
          message="Only the game master can access this page."
          onRetry={() => router.push(`/home/games/${id}`)}
          retryLabel="Back to game"
        />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <div className="flex flex-col gap-6">
        <PageTitle>Table Settings</PageTitle>

        <GmPlayersSection
          game={game}
          onPlayerRemoved={async () => {
            await mutate();
          }}
        />

        <GmLoreSection
          gameId={game.id}
          onCreateLoreEntry={() => setLoreEntryModalOpen(true)}
          onEditLoreEntry={(entry) => {
            setLoreEntryEditTarget(entry);
            setLoreEntryModalOpen(true);
          }}
          onDeleteLoreEntry={(entry) => {
            if (
              !window.confirm(
                `Delete lore entry "${entry.title}"? This cannot be undone.`
              )
            ) {
              return;
            }
            setDeletingLoreEntryId(entry.id);
            void deleteReferenceEntry(entry.id)
              .then(async () => {
                await refetchLoreEntries();
              })
              .finally(() => {
                setDeletingLoreEntryId(null);
              });
          }}
          deletingEntryId={deletingLoreEntryId}
          entries={loreEntries}
          loading={loreEntriesLoading}
          error={loreEntriesError}
          onRetry={() => void refetchLoreEntries()}
        />
        <GmRecapsSection
          recaps={recaps}
          loading={recapsLoading}
          error={recapsError}
          deletingRecapId={deletingRecapId}
          onRetry={() => void refetchRecaps()}
          onCreateRecap={() => {
            setRecapEditTarget(null);
            setRecapModalOpen(true);
          }}
          onEditRecap={(recap) => {
            setRecapEditTarget(recap);
            setRecapModalOpen(true);
          }}
          onOpenRecap={(recapId) => {
            void getRecapDownloadUrl(recapId, "inline").then((url) => {
              window.open(url, "_blank", "noopener,noreferrer");
            });
          }}
          onDownloadRecap={(recapId) => {
            void getRecapDownloadUrl(recapId, "attachment").then((url) => {
              window.open(url, "_blank", "noopener,noreferrer");
            });
          }}
          onDeleteRecap={(recap) => {
            if (
              !window.confirm(
                `Delete recap "${recap.title}"? This cannot be undone.`
              )
            ) {
              return;
            }
            setDeletingRecapId(recap.id);
            void deleteGameRecap(game.id, recap.id)
              .then(async () => {
                await refetchRecaps();
              })
              .finally(() => {
                setDeletingRecapId(null);
              });
          }}
        />
        <GmFilesSection
          files={files}
          loading={filesLoading}
          error={filesError}
          deletingFileId={deletingFileId}
          onRetry={() => void refetchFiles()}
          onCreateFile={() => {
            setFileEditTarget(null);
            setFileModalOpen(true);
          }}
          onEditFile={(file) => {
            setFileEditTarget(file);
            setFileModalOpen(true);
          }}
          onOpenFile={(file) => {
            void getGameFileUrl(file.id, "inline").then((url) => {
              window.open(url, "_blank", "noopener,noreferrer");
            });
          }}
          onDownloadFile={(file) => {
            void getGameFileUrl(file.id, "attachment").then((url) => {
              window.open(url, "_blank", "noopener,noreferrer");
            });
          }}
          onDeleteFile={(file) => {
            if (
              !window.confirm(
                `Delete file "${file.title}"? This cannot be undone.`
              )
            ) {
              return;
            }
            setDeletingFileId(file.id);
            void deleteGameFile(game.id, file.id)
              .then(async () => {
                await refetchFiles();
              })
              .finally(() => {
                setDeletingFileId(null);
              });
          }}
        />

        <GmInvitesSection
          onInviteUsers={() => setInviteModalOpen(true)}
          pendingInvites={pendingInvites}
        />

        {id ? (
          <GmDiscordSection
            gameId={id}
            integration={game.discordIntegration}
            initialGuildId={discordGuildId}
            onUpdated={async () => {
              await mutate();
            }}
          />
        ) : null}

        <GmPremiseSection
          gameId={game.id}
          premise={game.premise}
          onUpdated={async (updated) => {
            await mutate(updated, { revalidate: false });
          }}
        />

        <GmCoverImageSection
          gameId={game.id}
          gameName={game.name}
          imageKey={game.imageKey}
          onUpdated={async (updated) => {
            await mutate(updated, { revalidate: false });
          }}
        />

        <GmDangerZoneSection gameId={game.id} gameName={game.name} />
      </div>

      <InviteUsersModal
        isOpen={inviteModalOpen}
        gameId={game.id}
        gameName={game.name}
        onClose={() => setInviteModalOpen(false)}
        onSuccess={() => {
          void mutate();
          void mutatePendingInvites();
        }}
      />
      <CreateGameLoreEntryModal
        isOpen={loreEntryModalOpen}
        gameId={game.id}
        gameName={game.name}
        mode={loreEntryEditTarget ? "edit" : "create"}
        entry={loreEntryEditTarget}
        onClose={() => {
          setLoreEntryModalOpen(false);
          setLoreEntryEditTarget(null);
        }}
        onSuccess={() => {
          setLoreEntryEditTarget(null);
          void mutate();
          void refetchLoreEntries();
        }}
      />
      <CreateGameRecapModal
        key={recapEditTarget?.id ?? "create-recap"}
        isOpen={recapModalOpen}
        gameId={game.id}
        gameName={game.name}
        mode={recapEditTarget ? "edit" : "create"}
        recap={recapEditTarget}
        onClose={() => {
          setRecapModalOpen(false);
          setRecapEditTarget(null);
        }}
        onSuccess={() => {
          setRecapEditTarget(null);
          void refetchRecaps();
        }}
      />
      <CreateGameFileModal
        key={fileEditTarget?.id ?? "create-file"}
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
          void refetchFiles();
        }}
      />
    </PageSection>
  );
}
