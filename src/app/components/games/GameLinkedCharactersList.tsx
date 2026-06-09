"use client";

import { ExpandableClamp } from "@/app/components/shared/ExpandableClamp";
import { ResourceListCard } from "@/app/components/shared/ResourceListCard";
import { RemoveCharacterFromGameButton } from "@/app/components/games/RemoveCharacterFromGameButton";
import type { GameDetail } from "@/app/lib/types/game";
import Link from "next/link";

type GameCharacterRow = NonNullable<GameDetail["characters"]>[number];

function CharacterSummaryBlock({ summaryHtml }: { summaryHtml: string }) {
  return (
    <ExpandableClamp
      contentClassName="prose prose-sm max-w-none text-black/80"
      clampClassName="line-clamp-3"
      measureKey={summaryHtml}
    >
      <div dangerouslySetInnerHTML={{ __html: summaryHtml }} />
    </ExpandableClamp>
  );
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

        const summaryHtml = gi?.summary ?? "";
        const summaryBlock = summaryHtml ? (
          <CharacterSummaryBlock summaryHtml={summaryHtml} />
        ) : (
          <p className="text-sm text-black/60">No summary yet.</p>
        );

        const canRemoveFromGame =
          char.isOwnedByCurrentUser || game.isGameMaster === true;
        const canViewSheet =
          char.isOwnedByCurrentUser || game.isGameMaster === true;

        const sheetHref = char.isOwnedByCurrentUser
          ? `/home/characters/${char.id}?returnTo=${encodeURIComponent(returnTo)}`
          : game.isGameMaster
            ? `/home/games/${game.id}/characters/${char.id}`
            : null;

        const body = (
          <div className="space-y-2">
            {canViewSheet ? (
              sheetHref ? (
                <Link
                  href={sheetHref}
                  className="text-sm text-black/70 underline-offset-2 hover:underline"
                >
                  View character sheet
                </Link>
              ) : (
                <p className="text-sm text-black/70">View character sheet</p>
              )
            ) : null}
            {summaryBlock}
            {canRemoveFromGame ? (
              <RemoveCharacterFromGameButton
                className="pt-2"
                gameId={game.id}
                characterId={char.id}
                characterName={title}
                onRemoved={onRemoved}
              />
            ) : null}
          </div>
        );

        return (
          <ResourceListCard
            key={gc.id}
            href={
              char.isOwnedByCurrentUser
                ? `/home/characters/${char.id}?returnTo=${encodeURIComponent(returnTo)}`
                : game.isGameMaster
                  ? `/home/games/${game.id}/characters/${char.id}`
                  : undefined
            }
            title={title}
            subtitle={<>LVL {gi?.level ?? "—"}</>}
            imageUrl={imageUrl}
            imageKey={char.avatarKey}
            imageAlt={`${char.name} avatar`}
            className={
              char.isOwnedByCurrentUser ? "!border-neblirSafe-400" : ""
            }
            body={body}
          />
        );
      })}
    </div>
  );
}
