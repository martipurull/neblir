"use client";

import type { GameListItem } from "@/app/lib/types/game";
import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

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

const GameListCard: React.FC<GameListCardProps> = ({ game, imageUrl }) => {
  const [open, setOpen] = useState(false);
  const gmRow = gameMasterRow(game);
  const gm = gmRow?.user.name ?? "Unknown";
  const players = sortedPlayers(game);
  const initials = game.name.charAt(0).toUpperCase();
  const showImage =
    imageUrl && typeof imageUrl === "string" && imageUrl.length > 0;
  const showLoading = imageUrl === undefined;
  const gameHref = `/home/games/${game.id}`;

  return (
    <div
      className={`overflow-hidden rounded-md border border-black transition-colors ${
        open ? "bg-black/5" : ""
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <Link
          href={gameHref}
          className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-90"
        >
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/20">
            {showImage ? (
              <Image
                src={imageUrl}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 object-cover object-top"
              />
            ) : showLoading ? (
              <ImageLoadingSkeleton variant="avatar" />
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
            <p className="truncate text-xs text-black">GM: {gm}</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setOpen((o) => !o);
          }}
          className="shrink-0 rounded p-1 text-xs text-black hover:bg-black/10"
          aria-expanded={open}
          aria-label={
            open ? "Collapse GM and players" : "Expand GM and players"
          }
        >
          {open ? "▲" : "▼"}
        </button>
      </div>
      {open && (
        <div className="border-t border-black/10 px-5 py-3 pl-[4.25rem] space-y-3">
          <div>
            <p className="text-xs font-medium text-black/70">Game Master</p>
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
        </div>
      )}
    </div>
  );
};

export default GameListCard;
