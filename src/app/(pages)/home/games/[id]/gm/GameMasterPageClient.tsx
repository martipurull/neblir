"use client";

import { BrowseEnemiesModal } from "@/app/components/games/BrowseEnemiesModal";
import { CopyCustomEnemyModal } from "@/app/components/games/CopyCustomEnemyModal";
import { CreateCustomEnemyModal } from "@/app/components/games/CreateCustomEnemyModal";
import { CreateCustomItemModal } from "@/app/components/games/CreateCustomItemModal";
import { CreateUniqueItemModal } from "@/app/components/games/CreateUniqueItemModal";
import { GiveItemToCharacterModal } from "@/app/components/games/GiveItemToCharacterModal";
import { GmNpcInitiativeRollModal } from "@/app/components/games/GmNpcInitiativeRollModal";
import { ImportCustomEnemiesModal } from "@/app/components/games/ImportCustomEnemiesModal";
import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import { PageTitle } from "@/app/components/shared/PageTitle";
import { ThemedDatePicker } from "@/app/components/shared/ThemedDatePicker";
import {
  withAdjustedInitiativeEntry,
  withClearedInitiative,
  withRemovedInitiativeEntry,
} from "@/app/lib/gameInitiativeOptimistic";
import { isPastNextSessionDate } from "@/app/lib/nextSession";
import {
  GmCombatInitiativeSection,
  GmCustomEnemiesSection,
  GmDiceRollerSection,
  GmItemsSection,
  GmNpcsSection,
  GmTableSettingsCard,
} from "./sections";
import { GM_LIVE_GAME_REFRESH_MS, useGame } from "@/hooks/use-game";
import { useGames } from "@/hooks/use-games";
import {
  adjustGameInitiativeEntry,
  clearGameInitiative,
  removeGameInitiativeEntry,
  resetGameCombatReactions,
  setGameCharacterVisibility,
  updateGame,
} from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function GameMasterPageClient() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;
  const {
    game,
    loading,
    error,
    refetch,
    mutate,
    applyGameUpdate,
    applyOptimisticGameUpdate,
  } = useGame(id, { refreshInterval: GM_LIVE_GAME_REFRESH_MS });
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
  const [gmInitiativeRollModalOpen, setGmInitiativeRollModalOpen] =
    useState(false);
  const [initiativeActionId, setInitiativeActionId] = useState<string | null>(
    null
  );
  const [clearingInitiative, setClearingInitiative] = useState(false);
  const [resettingReactions, setResettingReactions] = useState(false);
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
        await applyGameUpdate(updated);
      } catch (err) {
        setNextSessionError(
          getUserSafeErrorMessage(err, "Failed to update date")
        );
      } finally {
        setNextSessionBusy(false);
      }
    },
    [id, applyGameUpdate]
  );

  const handleRemoveInitiativeEntry = useCallback(
    async (combatantRef: string) => {
      if (!id || !game) return;
      setInitiativeActionId(combatantRef);
      try {
        await applyOptimisticGameUpdate(
          withRemovedInitiativeEntry(game, combatantRef),
          () => removeGameInitiativeEntry(id, combatantRef)
        );
      } finally {
        setInitiativeActionId(null);
      }
    },
    [id, game, applyOptimisticGameUpdate]
  );

  const handleAdjustInitiativeEntry = useCallback(
    async (combatantRef: string, initiativeDelta: number) => {
      if (!id || !game) return;
      setInitiativeActionId(combatantRef);
      try {
        await applyOptimisticGameUpdate(
          withAdjustedInitiativeEntry(game, combatantRef, initiativeDelta),
          () => adjustGameInitiativeEntry(id, combatantRef, initiativeDelta)
        );
      } finally {
        setInitiativeActionId(null);
      }
    },
    [id, game, applyOptimisticGameUpdate]
  );

  const handleClearAllInitiative = useCallback(async () => {
    if (!id || !game) return;
    setClearingInitiative(true);
    try {
      await applyOptimisticGameUpdate(withClearedInitiative(game), () =>
        clearGameInitiative(id)
      );
    } finally {
      setClearingInitiative(false);
    }
  }, [id, game, applyOptimisticGameUpdate]);

  const handleResetCombatReactions = useCallback(async () => {
    if (!id) return;
    setResettingReactions(true);
    try {
      const updated = await resetGameCombatReactions(id);
      await applyGameUpdate(updated);
    } finally {
      setResettingReactions(false);
    }
  }, [id, applyGameUpdate]);

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

  const isPastNextSession = isPastNextSessionDate(game.nextSession);

  return (
    <PageSection>
      <div className="flex flex-col gap-6">
        <PageTitle>Game master</PageTitle>

        <div className="rounded-md border border-black p-4">
          <span className="text-sm font-semibold text-black">Next Session</span>
          <p className="mt-1 text-xs text-black/70">
            Set or clear the game&apos;s next session date.
          </p>
          {isPastNextSession ? (
            <div
              role="status"
              className="mt-3 rounded-md border border-neblirWarning-400 bg-neblirWarning-200/30 px-3 py-2"
            >
              <p className="text-sm text-neblirWarning-600">
                This next session date is in the past. Choose a future date, or
                select &quot;No next session planned&quot;.
              </p>
            </div>
          ) : null}
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
            {nextSessionValue ? (
              <Button
                type="button"
                variant="secondaryOutlineXs"
                fullWidth={false}
                disabled={nextSessionBusy}
                onClick={() => void handleNextSessionChange("")}
              >
                No next session planned
              </Button>
            ) : null}
            {nextSessionError ? (
              <p className="text-sm text-neblirDanger">{nextSessionError}</p>
            ) : null}
          </div>
        </div>

        <GmDiceRollerSection gameId={game.id} />

        <GmItemsSection
          gameId={game.id}
          onCreateCustom={() => setCustomItemModalOpen(true)}
          onCreateUnique={() => setUniqueItemModalOpen(true)}
          onGiveItem={() => setGiveItemModalOpen(true)}
        />

        <GmCombatInitiativeSection
          game={game}
          initiativeOrder={initiativeOrder}
          hasInitiativeEntries={hasInitiativeEntries}
          clearingInitiative={clearingInitiative}
          resettingReactions={resettingReactions}
          initiativeActionId={initiativeActionId}
          onClearAll={() => void handleClearAllInitiative()}
          onResetReactions={() => void handleResetCombatReactions()}
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
          onCharacterRemoved={async () => {
            await mutate();
          }}
          onCharactersAdded={async () => {
            await mutate();
          }}
          onInitiativeRolled={applyGameUpdate}
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
          onInitiativeRolled={applyGameUpdate}
        />

        <GmTableSettingsCard gameId={game.id} />
      </div>

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
        draftScope={{ kind: "game", id: game.id }}
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
        onSuccess={(updated) => applyGameUpdate(updated)}
      />
    </PageSection>
  );
}
