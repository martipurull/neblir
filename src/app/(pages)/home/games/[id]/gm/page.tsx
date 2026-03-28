"use client";

import CreateCustomItemModal from "@/app/components/games/CreateCustomItemModal";
import CreateUniqueItemModal from "@/app/components/games/CreateUniqueItemModal";
import { GmNpcInitiativeRollModal } from "@/app/components/games/GmNpcInitiativeRollModal";
import { GiveItemToCharacterModal } from "@/app/components/games/GiveItemToCharacterModal";
import InviteUsersModal from "@/app/components/games/InviteUsersModal";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import {
  GmInitiativeSection,
  GmDiscordSection,
  GmInvitesSection,
  GmItemsSection,
  GmPlaceholderSection,
} from "./sections";
import { useGame } from "@/hooks/use-game";
import { clearGameInitiative, removeGameInitiativeEntry } from "@/lib/api/game";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useState } from "react";
import useSWR from "swr";

type PendingInvite = {
  invitedUserId: string;
  invitedUserName: string;
  invitedUserEmail: string;
  createdAt: string;
};

export default function GameMasterPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;
  const discordGuildId = searchParams.get("discordGuildId");
  const { game, loading, error, refetch, mutate } = useGame(id);

  const [customItemModalOpen, setCustomItemModalOpen] = useState(false);
  const [uniqueItemModalOpen, setUniqueItemModalOpen] = useState(false);
  const [giveItemModalOpen, setGiveItemModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [gmInitiativeRollModalOpen, setGmInitiativeRollModalOpen] =
    useState(false);
  const [initiativeActionId, setInitiativeActionId] = useState<string | null>(
    null
  );
  const [clearingInitiative, setClearingInitiative] = useState(false);

  const initiativeOrder = game?.initiativeOrder ?? [];
  const hasInitiativeEntries = initiativeOrder.length > 0;

  const handleRemoveInitiativeEntry = useCallback(
    async (characterId: string) => {
      if (!id) return;
      setInitiativeActionId(characterId);
      try {
        const updated = await removeGameInitiativeEntry(id, characterId);
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

        <GmItemsSection
          onCreateCustom={() => setCustomItemModalOpen(true)}
          onCreateUnique={() => setUniqueItemModalOpen(true)}
          onGiveItem={() => setGiveItemModalOpen(true)}
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
          onOpenRollModal={() => setGmInitiativeRollModalOpen(true)}
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

        <GmPlaceholderSection title="NPCs">
          Manage non-player characters for this game. Coming soon.
        </GmPlaceholderSection>

        <GmPlaceholderSection title="Dice Roller">
          Roll dice for this game. Coming soon.
        </GmPlaceholderSection>

        <GmInvitesSection
          open={invitesOpen}
          onToggle={() => setInvitesOpen((o) => !o)}
          onInviteUsers={() => setInviteModalOpen(true)}
          pendingInvites={pendingInvites}
        />
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
      <CreateCustomItemModal
        isOpen={customItemModalOpen}
        gameId={game.id}
        gameName={game.name}
        onClose={() => setCustomItemModalOpen(false)}
        onSuccess={() => void mutate()}
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
