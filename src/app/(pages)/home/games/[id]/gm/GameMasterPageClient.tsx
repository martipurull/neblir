"use client";

import CreateCustomItemModal from "@/app/components/games/CreateCustomItemModal";
import CreateCustomEnemyModal from "@/app/components/games/CreateCustomEnemyModal";
import { BrowseEnemiesModal } from "@/app/components/games/BrowseEnemiesModal";
import { CopyCustomEnemyModal } from "@/app/components/games/CopyCustomEnemyModal";
import { ImportCustomEnemiesModal } from "@/app/components/games/ImportCustomEnemiesModal";
import CreateGameLoreEntryModal from "@/app/components/games/CreateGameLoreEntryModal";
import CreateGameRecapModal from "@/app/components/games/CreateGameRecapModal";
import CreateGameImageModal from "@/app/components/games/CreateGameImageModal";
import CreateUniqueItemModal from "@/app/components/games/CreateUniqueItemModal";
import { GmNpcInitiativeRollModal } from "@/app/components/games/GmNpcInitiativeRollModal";
import { GiveItemToCharacterModal } from "@/app/components/games/GiveItemToCharacterModal";
import InviteUsersModal from "@/app/components/games/InviteUsersModal";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import { ThemedDatePicker } from "@/app/components/shared/ThemedDatePicker";
import {
  GmInitiativeSection,
  GmDiscordSection,
  GmInvitesSection,
  GmItemsSection,
  GmCustomEnemiesSection,
  GmLoreSection,
  GmImagesSection,
  GmRecapsSection,
  GmNpcsSection,
  GmDiceRollerSection,
} from "./sections";
import { useGame } from "@/hooks/use-game";
import { useGames } from "@/hooks/use-games";
import { useGameImages } from "@/hooks/use-game-images";
import { useGameRecaps } from "@/hooks/use-game-recaps";
import { useReferenceEntries } from "@/hooks/use-reference-entries";
import {
  adjustGameInitiativeEntry,
  clearGameInitiative,
  removeGameInitiativeEntry,
  setGameCharacterVisibility,
  updateGame,
} from "@/lib/api/game";
import { deleteReferenceEntry } from "@/lib/api/referenceEntries";
import { deleteGameRecap, getRecapDownloadUrl } from "@/lib/api/recaps";
import { deleteGameImage } from "@/lib/api/gameImages";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { ReferenceEntry } from "@/app/lib/types/reference";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import useSWR from "swr";

type PendingInvite = {
  invitedUserId: string;
  invitedUserName: string;
  invitedUserEmail: string;
  createdAt: string;
};

export default function GameMasterPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;
  const discordGuildId = searchParams.get("discordGuildId");
  const { game, loading, error, refetch, mutate } = useGame(id);
  const { games: allGames } = useGames();

  const [customItemModalOpen, setCustomItemModalOpen] = useState(false);
  const [customEnemyModalOpen, setCustomEnemyModalOpen] = useState(false);
  const [editCustomEnemyId, setEditCustomEnemyId] = useState<string | null>(
    null
  );
  const [importCustomEnemiesOpen, setImportCustomEnemiesOpen] = useState(false);
  const [copyCustomEnemyOpen, setCopyCustomEnemyOpen] = useState(false);
  const [browseEnemiesOpen, setBrowseEnemiesOpen] = useState(false);
  const [uniqueItemModalOpen, setUniqueItemModalOpen] = useState(false);
  const [giveItemModalOpen, setGiveItemModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [loreEntryModalOpen, setLoreEntryModalOpen] = useState(false);
  const [recapModalOpen, setRecapModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [loreEntryEditTarget, setLoreEntryEditTarget] =
    useState<ReferenceEntry | null>(null);
  const [deletingLoreEntryId, setDeletingLoreEntryId] = useState<string | null>(
    null
  );
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [deletingRecapId, setDeletingRecapId] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [gmInitiativeRollModalOpen, setGmInitiativeRollModalOpen] =
    useState(false);
  const [initiativeActionId, setInitiativeActionId] = useState<string | null>(
    null
  );
  const [clearingInitiative, setClearingInitiative] = useState(false);
  const [nextSessionBusy, setNextSessionBusy] = useState(false);
  const [nextSessionError, setNextSessionError] = useState<string | null>(null);

  const initiativeOrder = game?.initiativeOrder ?? [];
  const hasInitiativeEntries = initiativeOrder.length > 0;
  const nextSessionValue =
    game?.nextSession != null
      ? new Date(game.nextSession).toISOString().slice(0, 10)
      : "";

  const handleNextSessionChange = useCallback(
    async (dateString: string) => {
      if (!id) return;
      const value = dateString || null;
      setNextSessionError(null);
      setNextSessionBusy(true);
      try {
        const updated = await updateGame(id, {
          nextSession: value ? `${value}T12:00:00.000Z` : null,
        });
        await mutate(updated, { revalidate: false });
      } catch (err) {
        setNextSessionError(
          getUserSafeErrorMessage(err, "Failed to update date")
        );
      } finally {
        setNextSessionBusy(false);
      }
    },
    [id, mutate]
  );

  const handleRemoveInitiativeEntry = useCallback(
    async (combatantRef: string) => {
      if (!id) return;
      setInitiativeActionId(combatantRef);
      try {
        const updated = await removeGameInitiativeEntry(id, combatantRef);
        await mutate(updated, { revalidate: false });
      } finally {
        setInitiativeActionId(null);
      }
    },
    [id, mutate]
  );

  const handleAdjustInitiativeEntry = useCallback(
    async (combatantRef: string, initiativeDelta: number) => {
      if (!id) return;
      setInitiativeActionId(combatantRef);
      try {
        const updated = await adjustGameInitiativeEntry(
          id,
          combatantRef,
          initiativeDelta
        );
        await mutate(updated, { revalidate: false });
      } finally {
        setInitiativeActionId(null);
      }
    },
    [id, mutate]
  );

  const handleClearAllInitiative = useCallback(async () => {
    if (!id) return;
    setClearingInitiative(true);
    try {
      const updated = await clearGameInitiative(id);
      await mutate(updated, { revalidate: false });
    } finally {
      setClearingInitiative(false);
    }
  }, [id, mutate]);

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
    images,
    loading: imagesLoading,
    error: imagesError,
    refetch: refetchImages,
  } = useGameImages(id);

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
        <PageTitle>Game master</PageTitle>

        <div className="rounded-md border border-black p-4">
          <span className="text-sm font-semibold text-black">Next Session</span>
          <p className="mt-1 text-xs text-black/70">
            Set or clear the game&apos;s next session date.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ThemedDatePicker
              value={nextSessionValue}
              onChange={(dateString) =>
                void handleNextSessionChange(dateString)
              }
              disabled={nextSessionBusy}
              ariaLabel="Next session date"
              placeholder="Set date"
            />
            {nextSessionError ? (
              <p className="text-sm text-red-600">{nextSessionError}</p>
            ) : null}
          </div>
        </div>

        <GmItemsSection
          onCreateCustom={() => setCustomItemModalOpen(true)}
          onCreateUnique={() => setUniqueItemModalOpen(true)}
          onGiveItem={() => setGiveItemModalOpen(true)}
        />

        <GmCustomEnemiesSection
          game={game}
          onCreate={() => {
            setEditCustomEnemyId(null);
            setCustomEnemyModalOpen(true);
          }}
          onOpenBrowse={() => setBrowseEnemiesOpen(true)}
          onEdit={(enemyId) => {
            setCustomEnemyModalOpen(false);
            setEditCustomEnemyId(enemyId);
          }}
          onOpenImport={() => setImportCustomEnemiesOpen(true)}
          onOpenCopy={() => setCopyCustomEnemyOpen(true)}
          onMutate={async () => {
            await mutate();
          }}
        />

        <GmInitiativeSection
          initiativeOrder={initiativeOrder}
          hasInitiativeEntries={hasInitiativeEntries}
          clearingInitiative={clearingInitiative}
          initiativeActionId={initiativeActionId}
          onClearAll={() => void handleClearAllInitiative()}
          onRemoveEntry={(characterId) =>
            void handleRemoveInitiativeEntry(characterId)
          }
          onAdjustEntry={(characterId, initiativeDelta) =>
            void handleAdjustInitiativeEntry(characterId, initiativeDelta)
          }
          onOpenRollModal={() => setGmInitiativeRollModalOpen(true)}
        />

        <GmNpcsSection
          game={game}
          onSetVisibility={async (characterId, isPublic) => {
            await setGameCharacterVisibility(game.id, characterId, isPublic);
            await mutate();
          }}
        />

        <GmDiceRollerSection gameId={game.id} />

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
          onCreateRecap={() => setRecapModalOpen(true)}
          onDownloadRecap={(recapId) => {
            void getRecapDownloadUrl(recapId).then((url) => {
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
        <GmImagesSection
          images={images}
          loading={imagesLoading}
          error={imagesError}
          deletingImageId={deletingImageId}
          onRetry={() => void refetchImages()}
          onCreateImage={() => setImageModalOpen(true)}
          onDeleteImage={(image) => {
            if (
              !window.confirm(
                `Delete image "${image.title}"? This cannot be undone.`
              )
            ) {
              return;
            }
            setDeletingImageId(image.id);
            void deleteGameImage(game.id, image.id)
              .then(async () => {
                await refetchImages();
              })
              .finally(() => {
                setDeletingImageId(null);
              });
          }}
        />

        <GmInvitesSection
          open={invitesOpen}
          onToggle={() => setInvitesOpen((o) => !o)}
          onInviteUsers={() => setInviteModalOpen(true)}
          pendingInvites={pendingInvites}
        />

        {id && (
          <GmDiscordSection
            gameId={id}
            integration={game.discordIntegration}
            initialGuildId={discordGuildId}
            onUpdated={async () => {
              await mutate();
            }}
          />
        )}
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
        isOpen={recapModalOpen}
        gameId={game.id}
        gameName={game.name}
        onClose={() => setRecapModalOpen(false)}
        onSuccess={() => {
          void refetchRecaps();
        }}
      />
      <CreateGameImageModal
        isOpen={imageModalOpen}
        gameId={game.id}
        gameName={game.name}
        onClose={() => setImageModalOpen(false)}
        onSuccess={() => {
          void refetchImages();
        }}
      />
      <CreateCustomItemModal
        isOpen={customItemModalOpen}
        gameId={game.id}
        gameName={game.name}
        onClose={() => setCustomItemModalOpen(false)}
        onSuccess={() => void mutate()}
      />
      <CreateCustomEnemyModal
        isOpen={customEnemyModalOpen || editCustomEnemyId != null}
        gameId={game.id}
        gameName={game.name}
        editCustomEnemyId={editCustomEnemyId}
        onClose={() => {
          setCustomEnemyModalOpen(false);
          setEditCustomEnemyId(null);
        }}
        onSuccess={() => void mutate()}
      />
      <ImportCustomEnemiesModal
        isOpen={importCustomEnemiesOpen}
        gameId={game.id}
        gameName={game.name}
        onClose={() => setImportCustomEnemiesOpen(false)}
        onSuccess={async () => {
          await mutate();
        }}
      />
      <CopyCustomEnemyModal
        isOpen={copyCustomEnemyOpen}
        targetGame={game}
        allGames={allGames}
        onClose={() => setCopyCustomEnemyOpen(false)}
        onSuccess={async () => {
          await mutate();
        }}
      />
      <BrowseEnemiesModal
        isOpen={browseEnemiesOpen}
        gameId={game.id}
        gameName={game.name}
        onClose={() => setBrowseEnemiesOpen(false)}
        onSuccess={async () => {
          await mutate();
        }}
      />
      <CreateUniqueItemModal
        isOpen={uniqueItemModalOpen}
        customTemplateGameIds={[game.id]}
        gameIdForSubmit={game.id}
        titleSuffix={game.name}
        onClose={() => setUniqueItemModalOpen(false)}
        onSuccess={() => void mutate()}
      />
      <GiveItemToCharacterModal
        isOpen={giveItemModalOpen}
        gameId={game.id}
        game={game}
        onClose={() => setGiveItemModalOpen(false)}
        onSuccess={() => void mutate()}
      />
      <GmNpcInitiativeRollModal
        isOpen={gmInitiativeRollModalOpen}
        onClose={() => setGmInitiativeRollModalOpen(false)}
        game={game}
        onSuccess={async () => {
          await mutate();
        }}
      />
    </PageSection>
  );
}
