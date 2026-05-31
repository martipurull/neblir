"use client";

import { StoredRichTextHtml } from "@/app/components/shared/StoredRichTextHtml";
import type { GameListItem } from "@/app/lib/types/game";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import Image from "next/image";
import Link from "next/link";

type GameListCardProps = {
  game: GameListItem;
  imageUrl?: string | null;
};

function gameMasterRow(game: GameListItem) {
  return game.users.find((u) => u.userId === game.gameMaster);
}

function sortedPlayers(game: GameListItem) {
  return [...game.users]
    .filter((u) => u.userId !== game.gameMaster)
    .sort((a, b) => a.user.name.localeCompare(b.user.name));
}

function formatNextSessionLabel(
  nextSession: Date | null | undefined,
  isGameMaster: boolean
): string {
  const nextSessionDate = nextSession != null ? new Date(nextSession) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPastNextSession = nextSessionDate != null && nextSessionDate < today;
  if (nextSessionDate == null || (!isGameMaster && isPastNextSession)) {
    return "No date set";
  }
  return nextSessionDate.toLocaleDateString();
}

const premiseScrollClassName =
  "mt-1 h-28 overflow-y-auto overscroll-y-contain rounded-sm border border-black/10 bg-paleBlue/20 px-2 py-1.5";

export function GameListCard({ game, imageUrl }: GameListCardProps) {
  const isGameMaster = game.isGameMaster === true;
  const gmRow = gameMasterRow(game);
  const gm = gmRow?.user.name ?? "Unknown";
  const players = sortedPlayers(game);
  const initials = game.name.charAt(0).toUpperCase();
  const showImage =
    imageUrl && typeof imageUrl === "string" && imageUrl.length > 0;
  const showLoading = imageUrl === undefined;
  const gameHref = `/home/games/${game.id}`;
  const nextSessionLabel = formatNextSessionLabel(
    game.nextSession,
    isGameMaster
  );
  const hasPremise = Boolean(game.premise?.trim());

  return (
    <Link
      href={gameHref}
      className="flex h-full flex-col overflow-hidden rounded-md border border-black text-black transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-black md:hover:bg-paleBlue/30"
    >
      <div className="flex shrink-0 items-center gap-3 px-5 py-4">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-paleBlue/20">
          {showImage ? (
            <Image
              src={imageUrl}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 object-cover object-top"
            />
          ) : showLoading ? (
            <ImageLoadingSkeleton variant="cityscape" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-black">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-black">
            {game.name}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col space-y-3 border-t border-black/10 px-5 py-3">
        <div>
          <p className="text-xs font-medium text-black/70">Next session</p>
          <p className="mt-0.5 text-sm text-black">{nextSessionLabel}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-black/70">Game master</p>
          <p className="mt-0.5 text-sm text-black">{gm}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-black/70">Players</p>
          {players.length > 0 ? (
            <ul className="mt-1 list-inside list-disc text-sm text-black">
              {players.map((row) => (
                <li key={row.userId} className="truncate">
                  {row.user.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-0.5 text-sm text-black/60">
              No players linked yet.
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-col pt-1">
          <p className="text-xs font-medium text-black/70">Premise</p>
          <div className={premiseScrollClassName}>
            {hasPremise ? (
              <StoredRichTextHtml
                content={game.premise}
                className="text-sm text-black/80"
              />
            ) : (
              <p className="text-sm italic text-black/50">No premise set.</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
