"use client";

import { ReferenceEntryHtml } from "@/app/components/reference/ReferenceEntryHtml";
import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import { useGame } from "@/hooks/use-game";
import { getReferenceEntry } from "@/lib/api/referenceEntries";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";
import useSWR from "swr";

function AccessBadge({ access }: { access: "PLAYER" | "GAME_MASTER" }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        access === "GAME_MASTER"
          ? "border-black/40 bg-black/10 text-black"
          : "border-customPrimary/60 bg-customPrimary/10 text-black"
      }`}
    >
      {access === "GAME_MASTER" ? "GM only" : "Player"}
    </span>
  );
}

export default function GameLoreEntryPage() {
  const params = useParams();
  const gameId = typeof params.id === "string" ? params.id : null;
  const entryId = typeof params.entryId === "string" ? params.entryId : null;
  const { game } = useGame(gameId);
  const {
    data: entry,
    error,
    isLoading,
    mutate,
  } = useSWR(entryId ? ["/api/reference-entries", entryId] : null, () =>
    getReferenceEntry(entryId as string)
  );

  if (isLoading) {
    return (
      <PageSection>
        <LoadingState text="Loading lore entry..." />
      </PageSection>
    );
  }

  if (!entry || error) {
    return (
      <PageSection>
        <ErrorState
          message={
            error instanceof Error ? error.message : "Lore entry not found"
          }
          onRetry={() => void mutate()}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  if (entry.gameId !== gameId || entry.category !== "CAMPAIGN_LORE") {
    return (
      <PageSection>
        <ErrorState
          message="This lore entry does not belong to this game."
          onRetry={() => void mutate()}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  const showAccessBadge = game?.isGameMaster === true;

  return (
    <PageSection>
      <div className="mb-4 flex items-center gap-2">
        <Link
          href={`/home/games/${gameId}/gm`}
          className="text-sm text-black/70 hover:underline"
        >
          ← Back to game master
        </Link>
      </div>
      <PageTitle>{entry.title}</PageTitle>
      {showAccessBadge ? (
        <div className="mt-2">
          <AccessBadge access={entry.access} />
        </div>
      ) : null}
      <InfoCard border className="mt-4">
        {entry.summary ? (
          <p className="mb-3 text-sm text-black/70">{entry.summary}</p>
        ) : null}
        <ReferenceEntryHtml
          contentJson={entry.contentJson}
          contentHtml={entry.contentHtml}
        />
      </InfoCard>
    </PageSection>
  );
}
