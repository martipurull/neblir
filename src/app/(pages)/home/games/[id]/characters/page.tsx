"use client";

import Button from "@/app/components/shared/Button";
import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import AddCharactersToGameModal from "@/app/components/games/AddCharactersToGameModal";
import ResourceListCard from "@/app/components/shared/ResourceListCard";
import RemoveCharacterFromGameButton from "@/app/components/games/RemoveCharacterFromGameButton";
import { useGame } from "@/hooks/use-game";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";

function stripHtml(html: string): string {
  if (!html) return "";
  // Browser-safe: this file is a client component.
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

export default function GameCharactersPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game, loading, error, refetch } = useGame(id);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [expandedByCharacterId, setExpandedByCharacterId] = useState<
    Record<string, boolean>
  >({});

  const characters = useMemo(() => game?.characters ?? [], [game?.characters]);
  const gameMasterId = game?.gameMaster ?? null;
  const { playerCharacters, knownNpcs } = useMemo<{
    playerCharacters: typeof characters;
    knownNpcs: typeof characters;
  }>(() => {
    if (!gameMasterId) {
      return { playerCharacters: characters, knownNpcs: [] };
    }
    const players = characters.filter(
      (gc) => !gc.character.linkedUserIds?.includes(gameMasterId)
    );
    const npcs = characters.filter((gc) =>
      gc.character.linkedUserIds?.includes(gameMasterId)
    );
    return { playerCharacters: players, knownNpcs: npcs };
  }, [characters, gameMasterId]);
  const alreadyLinkedCharacterIds = useMemo(
    () => characters.map((gc) => gc.character.id),
    [characters]
  );

  const imageEntries = useMemo(
    () =>
      game?.characters?.map((gc) => ({
        id: gc.character.id,
        imageKey: gc.character.avatarKey,
      })) ?? [],
    [game?.characters]
  );
  const imageUrls = useImageUrls(imageEntries);

  const renderCharacterList = (
    list: typeof characters,
    gameId: string,
    emptyText: string
  ): React.ReactNode => {
    if (list.length === 0) {
      return <p className="py-2 text-sm text-black/60">{emptyText}</p>;
    }

    return (
      <div className="space-y-2">
        {list.map((gc) => {
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
                  gameId={gameId}
                  characterId={char.id}
                  onRemoved={refetch}
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
                char.isOwnedByCurrentUser
                  ? `/home/characters/${char.id}`
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
  };

  if (loading || (!game && !error)) {
    return (
      <PageSection>
        <LoadingState text="Loading game..." />
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

  return (
    <PageSection>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <PageTitle>Characters</PageTitle>
          <p className="mt-1 text-sm text-black/70">
            Player characters and known NPCs linked to{" "}
            <span className="font-semibold">{game.name}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="solidDark"
          fullWidth={false}
          onClick={() => setAddModalOpen(true)}
        >
          Add characters
        </Button>
      </div>

      <AddCharactersToGameModal
        isOpen={addModalOpen}
        gameId={game.id}
        gameName={game.name}
        alreadyLinkedCharacterIds={alreadyLinkedCharacterIds}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => void refetch()}
      />

      <InfoCard
        id="player-characters"
        border={false}
        className="mt-4 scroll-mt-4"
      >
        <h2 className="text-sm font-semibold text-black">Player Characters</h2>
        <div className="mt-2">
          {renderCharacterList(
            playerCharacters,
            game.id,
            "No player characters linked to this game yet."
          )}
        </div>
      </InfoCard>

      <InfoCard id="known-npcs" border={false} className="mt-4 scroll-mt-4">
        <h2 className="text-sm font-semibold text-black">Known NPCs</h2>
        <div className="mt-2">
          {renderCharacterList(
            knownNpcs,
            game.id,
            "No known NPCs for this game yet."
          )}
        </div>
      </InfoCard>
    </PageSection>
  );
}
