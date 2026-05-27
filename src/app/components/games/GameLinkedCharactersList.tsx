"use client";

import { Button } from "@/app/components/shared/Button";
import { ResourceListCard } from "@/app/components/shared/ResourceListCard";
import { RemoveCharacterFromGameButton } from "@/app/components/games/RemoveCharacterFromGameButton";
import type { GameDetail } from "@/app/lib/types/game";
import { useState } from "react";

type GameCharacterRow = NonNullable<GameDetail["characters"]>[number];

function stripHtml(html: string): string {
  if (!html) return "";
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

type GameLinkedCharactersListProps = {
  characters: GameCharacterRow[];
  game: GameDetail;
  emptyText: string;
  returnTo: string;
  imageUrls: Record<string, string | null | undefined>;
  onRemoved: () => void | Promise<void>;
};

export function GameLinkedCharactersList({
  characters,
  game,
  emptyText,
  returnTo,
  imageUrls,
  onRemoved,
}: GameLinkedCharactersListProps) {
  const [expandedByCharacterId, setExpandedByCharacterId] = useState<
    Record<string, boolean>
  >({});

  if (characters.length === 0) {
    return <p className="py-2 text-sm text-black/60">{emptyText}</p>;
  }

  return (
    <div className="space-y-2">
      {characters.map((gc) => {
        const char = gc.character;
        const gi = char.generalInformation;
        const title = `${char.name}${char.surname ? ` ${char.surname}` : ""}`;
        const imageUrl = char.avatarKey
          ? (imageUrls[char.id] ?? undefined)
          : null;
        const initials =
          char.name.charAt(0).toUpperCase() +
          (char.surname?.charAt(0).toUpperCase() ??
            char.name.charAt(1)?.toUpperCase() ??
            "");

        const summaryHtml = gi?.summary ?? "";
        const summaryText = stripHtml(summaryHtml);
        const expanded = expandedByCharacterId[char.id] === true;
        const canExpand = summaryText.length > 180;

        const rightAccessory = canExpand ? (
          <Button
            type="button"
            variant="lightChevronExpand"
            fullWidth={false}
            aria-label={expanded ? "Collapse summary" : "Expand summary"}
            aria-expanded={expanded}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpandedByCharacterId((prev) => ({
                ...prev,
                [char.id]: !expanded,
              }));
            }}
          >
            <span aria-hidden>{expanded ? "▾" : "▸"}</span>
          </Button>
        ) : null;

        const summaryBlock = summaryHtml ? (
          <div
            className={[
              "prose prose-sm max-w-none text-black/80",
              expanded ? "" : "line-clamp-2",
            ].join(" ")}
            dangerouslySetInnerHTML={{ __html: summaryHtml }}
          />
        ) : (
          <p className="text-sm text-black/60">No summary yet.</p>
        );

        const body = char.isOwnedByCurrentUser ? (
          expanded ? (
            <div className="space-y-2">
              <p className="text-sm text-black/70">View character sheet</p>
              {summaryBlock}
              <RemoveCharacterFromGameButton
                className="pt-2"
                gameId={game.id}
                characterId={char.id}
                onRemoved={onRemoved}
              />
            </div>
          ) : (
            <p className="text-sm text-black/70">View character sheet</p>
          )
        ) : (
          summaryBlock
        );

        return (
          <ResourceListCard
            key={gc.id}
            href={
              char.isOwnedByCurrentUser || game.isGameMaster
                ? `/home/characters/${char.id}?returnTo=${encodeURIComponent(returnTo)}`
                : undefined
            }
            title={title}
            subtitle={<>LVL {gi?.level ?? "—"}</>}
            imageUrl={imageUrl}
            imageAlt={`${char.name} avatar`}
            placeholder={initials}
            className={
              char.isOwnedByCurrentUser ? "!border-neblirSafe-400" : ""
            }
            rightAccessory={rightAccessory}
            body={body}
          />
        );
      })}
    </div>
  );
}
