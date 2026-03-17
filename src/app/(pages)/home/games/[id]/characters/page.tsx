"use client";

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
import Link from "next/link";
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
  const count = characters.length;
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
      <div className="mb-4 flex items-center gap-2">
        <Link
          href={`/home/games/${game.id}`}
          className="text-sm text-black/70 hover:underline"
        >
          ← {game.name}
        </Link>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <PageTitle>Characters</PageTitle>
          <p className="mt-1 text-sm text-black/70">
            Characters linked to this game ({count})
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md border border-black bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          Add characters
        </button>
      </div>

      <AddCharactersToGameModal
        isOpen={addModalOpen}
        gameId={game.id}
        gameName={game.name}
        alreadyLinkedCharacterIds={alreadyLinkedCharacterIds}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => void refetch()}
      />

      <InfoCard border={false} className="mt-4">
        {characters.length === 0 ? (
          <p className="py-2 text-sm text-black/60">
            No characters linked to this game yet.
          </p>
        ) : (
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
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/15 text-black/70 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
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
                </button>
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
                    <p className="text-sm text-black/70">
                      View character sheet
                    </p>
                    {summaryBlock}
                    <RemoveCharacterFromGameButton
                      className="pt-2"
                      gameId={game.id}
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
        )}
      </InfoCard>
    </PageSection>
  );
}
