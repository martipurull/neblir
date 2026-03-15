"use client";

import InfoCard from "@/app/components/shared/InfoCard";
import type { GameInviteItem } from "@/hooks/use-game-invites";
import Link from "next/link";
import React from "react";

type GameInvitesReceivedBlockProps = {
  invites: GameInviteItem[];
  acceptingId: string | null;
  decliningId: string | null;
  onAccept: (gameId: string) => void;
  onDecline: (gameId: string) => void;
  /** If true, show a link to Games at the bottom. */
  showGamesLink?: boolean;
};

const GameInvitesReceivedBlock: React.FC<GameInvitesReceivedBlockProps> = ({
  invites,
  acceptingId,
  decliningId,
  onAccept,
  onDecline,
  showGamesLink = false,
}) => {
  if (invites.length === 0) return null;

  return (
    <InfoCard border className="mb-4 bg-paleBlue/30">
      <h2 className="text-sm font-semibold text-black">Game invites</h2>
      <p className="mt-1 text-xs text-black/70">
        You’ve been invited to the following games. Accept to join.
      </p>
      <ul className="mt-3 space-y-2">
        {invites.map((inv) => (
          <li
            key={inv.gameId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-black/10 bg-white/50 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-black">
                {inv.gameName}
              </p>
              <p className="text-xs text-black/70">
                Invited by {inv.invitedByName}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => void onAccept(inv.gameId)}
                disabled={acceptingId !== null}
                className="rounded-md bg-customPrimary px-3 py-1.5 text-xs font-medium text-customSecondary transition-colors hover:bg-customPrimaryHover disabled:opacity-50"
              >
                {acceptingId === inv.gameId ? "Accepting…" : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => void onDecline(inv.gameId)}
                disabled={decliningId !== null}
                className="rounded-md border border-black/30 bg-transparent px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-black/10 disabled:opacity-50"
              >
                {decliningId === inv.gameId ? "Declining…" : "Decline"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {showGamesLink && (
        <p className="mt-3 text-xs text-black/70">
          <Link href="/home/games" className="underline hover:text-black">
            View all games →
          </Link>
        </p>
      )}
    </InfoCard>
  );
};

export default GameInvitesReceivedBlock;
