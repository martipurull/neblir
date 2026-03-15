"use client";

import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import { useGame } from "@/hooks/use-game";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

export default function GameCustomItemsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game, loading, error, refetch } = useGame(id);

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

  const customItems = game.customItems ?? [];
  const hasItems = customItems.length > 0;

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
      <PageTitle>Custom items</PageTitle>
      <p className="mt-1 text-sm text-black/70">
        Custom and unique items for this game
      </p>

      <InfoCard border={false} className="mt-4">
        {hasItems ? (
          <ul className="space-y-2">
            {customItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-md border border-black/10 px-3 py-2 text-sm text-black"
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-black/60">{item.type}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-black/60">
            No custom items for this game yet.
          </p>
        )}
      </InfoCard>
    </PageSection>
  );
}
