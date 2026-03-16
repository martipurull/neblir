"use client";

import CreateCustomItemModal from "@/app/components/games/CreateCustomItemModal";
import CreateUniqueItemModal from "@/app/components/games/CreateUniqueItemModal";
import { GiveItemToCharacterModal } from "@/app/components/games/GiveItemToCharacterModal";
import InviteUsersModal from "@/app/components/games/InviteUsersModal";
import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import { useGame } from "@/hooks/use-game";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import useSWR from "swr";

type PendingInvite = {
  invitedUserId: string;
  invitedUserName: string;
  invitedUserEmail: string;
  createdAt: string;
};

export default function GameMasterPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;
  const { game, loading, error, refetch, mutate } = useGame(id);

  const [customItemModalOpen, setCustomItemModalOpen] = useState(false);
  const [uniqueItemModalOpen, setUniqueItemModalOpen] = useState(false);
  const [giveItemModalOpen, setGiveItemModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);

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
        <div className="flex items-center gap-4">
          <Link
            href={`/home/games/${id}`}
            className="text-sm font-medium text-black/70 hover:text-black"
          >
            ← Back to game
          </Link>
        </div>

        <PageTitle>Game master</PageTitle>

        {/* Items: Create Custom, Create Unique, Give Item */}
        <InfoCard border>
          <h2 className="text-sm font-semibold text-black">Items</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCustomItemModalOpen(true)}
              className="rounded-md bg-customPrimary px-4 py-2 text-sm font-medium text-customSecondary hover:bg-customPrimaryHover"
            >
              Create custom item
            </button>
            <button
              type="button"
              onClick={() => setUniqueItemModalOpen(true)}
              className="rounded-md bg-customPrimary px-4 py-2 text-sm font-medium text-customSecondary hover:bg-customPrimaryHover"
            >
              Create unique item
            </button>
            <button
              type="button"
              onClick={() => setGiveItemModalOpen(true)}
              className="rounded-md bg-customPrimary px-4 py-2 text-sm font-medium text-customSecondary hover:bg-customPrimaryHover"
            >
              Give item to character
            </button>
          </div>
        </InfoCard>

        {/* NPCs – placeholder for future functionality */}
        <InfoCard border>
          <h2 className="text-sm font-semibold text-black">NPCs</h2>
          <p className="mt-1 text-sm text-black/70">
            Manage non-player characters for this game. Coming soon.
          </p>
        </InfoCard>

        {/* Dice Roller – placeholder for future functionality */}
        <InfoCard border>
          <h2 className="text-sm font-semibold text-black">Dice Roller</h2>
          <p className="mt-1 text-sm text-black/70">
            Roll dice for this game. Coming soon.
          </p>
        </InfoCard>

        {/* Collapsible Invites */}
        <InfoCard border className="bg-paleBlue/20">
          <button
            type="button"
            onClick={() => setInvitesOpen((o) => !o)}
            className="flex w-full items-center justify-between text-left"
          >
            <h2 className="text-sm font-semibold text-black">Invites</h2>
            <span className="text-black/70">{invitesOpen ? "▼" : "▶"}</span>
          </button>
          {invitesOpen && (
            <div className="mt-3 space-y-3">
              <button
                type="button"
                onClick={() => setInviteModalOpen(true)}
                className="rounded-md bg-customPrimary px-4 py-2 text-sm font-medium text-customSecondary hover:bg-customPrimaryHover"
              >
                Invite users
              </button>
              {pendingInvites.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-black/70">
                    Pending invites
                  </p>
                  <ul className="mt-2 space-y-2">
                    {pendingInvites.map((inv) => (
                      <li
                        key={inv.invitedUserId}
                        className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-black/10 bg-white/50 px-3 py-2 text-sm text-black"
                      >
                        <span className="font-medium">
                          {inv.invitedUserName}
                        </span>
                        <span className="truncate text-xs text-black/70">
                          {inv.invitedUserEmail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </InfoCard>
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
        gameId={game.id}
        gameName={game.name}
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
    </PageSection>
  );
}
