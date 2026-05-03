"use client";

import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import type { GameDetail, GameListItem } from "@/app/lib/types/game";
import { copyCustomEnemyToGame } from "@/lib/api/customEnemies";
import useSWR from "swr";
import { useCallback, useMemo, useState } from "react";

type CopyCustomEnemyModalProps = {
  isOpen: boolean;
  targetGame: GameDetail;
  /** Games returned from GET /api/games (same user). */
  allGames: GameListItem[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export function CopyCustomEnemyModal({
  isOpen,
  targetGame,
  allGames,
  onClose,
  onSuccess,
}: CopyCustomEnemyModalProps) {
  const sourceGames = useMemo(
    () =>
      allGames.filter(
        (g) => g.id !== targetGame.id && g.gameMaster === targetGame.gameMaster
      ),
    [allGames, targetGame.gameMaster, targetGame.id]
  );

  const [sourceGameId, setSourceGameId] = useState("");
  const [sourceEnemyId, setSourceEnemyId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: sourceEnemies = [] } = useSWR<
    Array<{ id: string; name: string; initiativeModifier: number }>
  >(
    isOpen && sourceGameId
      ? `/api/games/${encodeURIComponent(sourceGameId)}/custom-enemies`
      : null
  );

  const gameOptions = useMemo(
    () =>
      sourceGames.map((g) => ({
        value: g.id,
        label: g.name,
      })),
    [sourceGames]
  );

  const enemyOptions = useMemo(
    () =>
      sourceEnemies.map((e) => ({
        value: e.id,
        label: `${e.name} (init ${e.initiativeModifier >= 0 ? "+" : ""}${e.initiativeModifier})`,
      })),
    [sourceEnemies]
  );

  const handleClose = useCallback(() => {
    setSourceGameId("");
    setSourceEnemyId("");
    setError(null);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!sourceGameId || !sourceEnemyId) {
      setError("Select a source game and enemy.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await copyCustomEnemyToGame(targetGame.id, sourceGameId, sourceEnemyId);
      await onSuccess();
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copy failed.");
    } finally {
      setBusy(false);
    }
  }, [handleClose, onSuccess, sourceEnemyId, sourceGameId, targetGame.id]);

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={handleClose}
      title={`Copy custom enemy into ${targetGame.name}`}
      titleId="copy-custom-enemy-title"
      maxWidthClass="max-w-md"
    >
      {sourceGames.length === 0 ? (
        <p className="mt-3 text-sm text-white/80">
          You are not the game master of any other campaign. Create another game
          where you are GM to copy enemies from it.
        </p>
      ) : (
        <>
          <div className="mt-3">
            <SelectDropdown
              id="copy-enemy-source-game"
              label="Source game"
              placeholder="Select game"
              value={sourceGameId}
              options={gameOptions}
              onChange={(id) => {
                setSourceGameId(id);
                setSourceEnemyId("");
              }}
            />
          </div>
          <div className="mt-3">
            <SelectDropdown
              id="copy-enemy-source-enemy"
              label="Enemy to copy"
              placeholder={sourceGameId ? "Select enemy" : "Pick a game first"}
              value={sourceEnemyId}
              options={enemyOptions}
              disabled={!sourceGameId}
              onChange={setSourceEnemyId}
            />
          </div>
        </>
      )}
      {error ? (
        <p className="mt-3 text-sm text-neblirDanger-300">{error}</p>
      ) : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="secondaryOutlineXs"
          onClick={handleClose}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="semanticWarningOutline"
          onClick={() => void handleSubmit()}
          disabled={
            busy || sourceGames.length === 0 || !sourceGameId || !sourceEnemyId
          }
        >
          {busy ? "Copying…" : "Copy into this game"}
        </Button>
      </div>
    </ModalShell>
  );
}
