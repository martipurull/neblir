"use client";

import { ReferenceEntriesPage } from "@/app/components/reference/ReferenceEntriesPage";
import { useGame } from "@/hooks/use-game";
import { useParams } from "next/navigation";

export default function GameLorePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game } = useGame(id);
  const showAccessBadges = game?.isGameMaster === true;

  return (
    <ReferenceEntriesPage
      category="CAMPAIGN_LORE"
      gameId={id ?? undefined}
      showAccessBadges={showAccessBadges}
      title="Lore"
      description="Campaign lore entries for this game."
      loadingText="Loading lore..."
      emptyText="No lore entries found yet."
    />
  );
}
