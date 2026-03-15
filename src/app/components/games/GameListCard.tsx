"use client";

import type { GameListItem } from "@/app/lib/types/game";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

type GameListCardProps = {
  game: GameListItem;
  imageUrl?: string | null;
};

function gameMasterName(game: GameListItem): string {
  const row = game.users.find((u) => u.userId === game.gameMaster);
  return row?.user.name ?? "Unknown";
}

function sortedGameUsers(game: GameListItem) {
  return [...game.users].sort((a, b) => a.user.name.localeCompare(b.user.name));
}

const GameListCard: React.FC<GameListCardProps> = ({ game, imageUrl }) => {
  const [open, setOpen] = useState(false);
  const gm = gameMasterName(game);
  const players = sortedGameUsers(game);
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
              <div className="flex h-full w-full items-center justify-center text-[10px] text-black">
                ...
              </div>
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
          aria-label={open ? "Collapse players" : "Expand players"}
        >
          {open ? "▲" : "▼"}
        </button>
      </div>
      {open && players.length > 0 && (
        <div className="border-t border-black/10 px-5 py-3 pl-[4.25rem]">
          <p className="text-xs font-medium text-black/70">Players</p>
          <ul className="mt-1 list-inside list-disc text-sm text-black">
            {players.map((row) => (
              <li key={row.userId} className="truncate">
                {row.user.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {open && players.length === 0 && (
        <div className="border-t border-black/10 px-5 py-3 pl-[4.25rem] text-sm text-black/60">
          No players linked yet.
        </div>
      )}
    </div>
  );
};

export default GameListCard;
