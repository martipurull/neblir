import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import type { GameDetail } from "@/app/lib/types/game";
import { downloadGameCustomEnemies } from "@/lib/api/customEnemies";
import { GmEnemyInstanceList } from "./GmEnemyInstanceList";
import { GmSectionTitle } from "./GmSectionTitle";
import { useState } from "react";

type GmCustomEnemiesSectionProps = {
  game: GameDetail;
  onCreate: () => void;
  onOpenBrowse: () => void;
  onOpenBrowseCustom: () => void;
  onOpenImport: () => void;
  onOpenCopy: () => void;
  onMutate: () => void | Promise<void>;
  applyOptimisticGameUpdate: (
    optimistic: GameDetail,
    request: () => Promise<GameDetail>
  ) => Promise<unknown>;
  onInitiativeRolled: (game: GameDetail) => void | Promise<void>;
};

export function GmCustomEnemiesSection({
  game,
  onCreate,
  onOpenBrowse,
  onOpenBrowseCustom,
  onOpenImport,
  onOpenCopy,
  onMutate,
  applyOptimisticGameUpdate,
  onInitiativeRolled,
}: GmCustomEnemiesSectionProps) {
  const enemies = game.customEnemies ?? [];
  const [busyAll, setBusyAll] = useState(false);

  return (
    <InfoCard border>
      <GmSectionTitle>Enemies</GmSectionTitle>
      <p className="mt-1 text-xs text-black/70">
        Add official enemies to this campaign or create your own, then manage,
        export, import, or copy enemies across your games.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onOpenBrowse}
        >
          Browse enemies
        </Button>
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onOpenBrowseCustom}
        >
          Browse custom enemies
        </Button>
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onCreate}
        >
          Create custom enemy
        </Button>
        <Button
          type="button"
          variant="secondaryOutlineXs"
          fullWidth={false}
          disabled={busyAll || enemies.length === 0}
          onClick={() => {
            setBusyAll(true);
            void downloadGameCustomEnemies(game.id, "csv")
              .catch((e) =>
                window.alert(e instanceof Error ? e.message : String(e))
              )
              .finally(() => setBusyAll(false));
          }}
        >
          {busyAll ? "Downloading…" : "Download all (CSV)"}
        </Button>
        <Button
          type="button"
          variant="secondaryOutlineXs"
          fullWidth={false}
          disabled={busyAll || enemies.length === 0}
          onClick={() => {
            setBusyAll(true);
            void downloadGameCustomEnemies(game.id, "json")
              .catch((e) =>
                window.alert(e instanceof Error ? e.message : String(e))
              )
              .finally(() => setBusyAll(false));
          }}
        >
          {busyAll ? "Downloading…" : "Download all (JSON)"}
        </Button>
        <Button
          type="button"
          variant="secondaryOutlineXs"
          fullWidth={false}
          onClick={onOpenImport}
        >
          Upload from CSV/JSON
        </Button>
        <Button
          type="button"
          variant="secondaryOutlineXs"
          fullWidth={false}
          onClick={onOpenCopy}
        >
          Copy from another game
        </Button>
      </div>

      <GmEnemyInstanceList
        game={game}
        onMutate={onMutate}
        applyOptimisticGameUpdate={applyOptimisticGameUpdate}
        onInitiativeRolled={onInitiativeRolled}
      />
    </InfoCard>
  );
}
