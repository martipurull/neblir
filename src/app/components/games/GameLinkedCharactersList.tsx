"use client";

import { ExpandableClamp } from "@/app/components/shared/ExpandableClamp";
import { ResourceListCard } from "@/app/components/shared/ResourceListCard";
import { StoredRichTextHtml } from "@/app/components/shared/StoredRichTextHtml";
import { RemoveCharacterFromGameButton } from "@/app/components/games/RemoveCharacterFromGameButton";
import { isKnownNpcSheetLinkForViewer } from "@/app/lib/gmUtils";
import type { GameDetail } from "@/app/lib/types/game";
import { useUser } from "@/hooks/use-user";
import Link from "next/link";

type GameCharacterRow = NonNullable<GameDetail["characters"]>[number];

function CharacterSummaryBlock({ summaryHtml }: { summaryHtml: string }) {
  return (
    <ExpandableClamp
      contentClassName="prose prose-sm max-w-none text-black/80"
      clampClassName="line-clamp-3"
      measureKey={summaryHtml}
    >
      <StoredRichTextHtml
        content={summaryHtml}
        className="prose prose-sm max-w-none text-black/80"
      />
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
  const { user } = useUser();
  const viewerId = user?.id;

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
        const isPlayGrantee =
          viewerId != null && isKnownNpcSheetLinkForViewer(gc, game, viewerId);
        const canViewSheet =
          char.isOwnedByCurrentUser ||
          game.isGameMaster === true ||
          isPlayGrantee;

        const sheetHref = char.isOwnedByCurrentUser
          ? `/home/characters/${char.id}?returnTo=${encodeURIComponent(returnTo)}`
          : game.isGameMaster === true || isPlayGrantee
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
                : game.isGameMaster === true || isPlayGrantee
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
