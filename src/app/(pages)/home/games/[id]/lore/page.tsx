"use client";

import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import { useGame } from "@/hooks/use-game";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

export default function GameLorePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game, loading } = useGame(id);

  if (loading) {
    return (
      <PageSection>
        <LoadingState text="Loading..." />
      </PageSection>
    );
  }

  return (
    <PageSection>
      {game && (
        <div className="mb-4 flex items-center gap-2">
          <Link
            href={`/home/games/${game.id}`}
            className="text-sm text-black/70 hover:underline"
          >
            ← {game.name}
          </Link>
        </div>
      )}
      <PageTitle>Lore</PageTitle>
      <InfoCard border className="mt-4">
        <p className="text-sm text-black/70">Lore section coming soon.</p>
      </InfoCard>
    </PageSection>
  );
}
