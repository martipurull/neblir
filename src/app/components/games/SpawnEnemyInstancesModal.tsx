"use client";

import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { TextField } from "@/app/components/shared/TextField";
import { spawnEnemyInstances } from "@/lib/api/enemyInstances";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useEffect, useState } from "react";

export type SpawnEnemyInstancesSource =
  | { sourceType: "custom"; sourceCustomEnemyId: string; defaultName: string }
  | {
      sourceType: "official";
      sourceOfficialEnemyId: string;
      defaultName: string;
    };

type SpawnEnemyInstancesModalProps = {
  isOpen: boolean;
  gameId: string;
  source: SpawnEnemyInstancesSource | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export function SpawnEnemyInstancesModal({
  isOpen,
  gameId,
  source,
  onClose,
  onSuccess,
}: SpawnEnemyInstancesModalProps) {
  const [count, setCount] = useState("1");
  const [nameOverride, setNameOverride] = useState("");
  const [knownToPlayers, setKnownToPlayers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !source) return;
    setCount("1");
    setNameOverride("");
    setKnownToPlayers(false);
    setError(null);
  }, [isOpen, source]);

  if (!isOpen || !source) return null;

  const title = `Spawn — ${source.defaultName}`;

  const handleSubmit = async () => {
    setError(null);
    const n = Math.min(50, Math.max(1, Math.floor(Number(count)) || 1));
    const trimmed = nameOverride.trim();
    setBusy(true);
    try {
      if (source.sourceType === "custom") {
        await spawnEnemyInstances(gameId, {
          sourceCustomEnemyId: source.sourceCustomEnemyId,
          count: n,
          isPublic: knownToPlayers,
          ...(trimmed ? { nameOverride: trimmed } : {}),
        });
      } else {
        await spawnEnemyInstances(gameId, {
          sourceOfficialEnemyId: source.sourceOfficialEnemyId,
          count: n,
          isPublic: knownToPlayers,
          ...(trimmed ? { nameOverride: trimmed } : {}),
        });
      }
      await onSuccess();
      onClose();
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to spawn"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title={title}
      titleId="spawn-enemy-instances-title"
      maxWidthClass="max-w-md"
    >
      <p className="mt-2 text-xs text-white/75">
        Multiple copies are named with “#1”, “#2”, … You can rename any instance
        on its manage page.
      </p>
      <div className="mt-4 space-y-3 text-sm text-white">
        <ModalNumberField
          id="spawn-enemy-count"
          label="Count"
          value={count}
          onChange={setCount}
          min={1}
          max={50}
          disabled={busy}
          required={false}
        />
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Name prefix (optional)
          </span>
          <TextField
            type="text"
            variant="dark"
            value={nameOverride}
            onChange={(e) => setNameOverride(e.target.value)}
            placeholder={source.defaultName}
            className="mt-1"
          />
        </label>
        <Checkbox
          checked={knownToPlayers}
          onChange={setKnownToPlayers}
          tone="inverse"
          label={<span className="text-white/90">Known to players?</span>}
        />
        <p className="text-xs text-white/65">
          Leave unchecked to keep spawned instances private to you (GM only).
          Discord rolls default to secret until you reveal them.
        </p>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-neblirDanger-300">{error}</p>
      ) : null}
      <div className="mt-5 flex justify-end gap-2">
        <Button
          type="button"
          variant="secondaryOutlineXs"
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="semanticWarningOutline"
          disabled={busy}
          onClick={() => void handleSubmit()}
        >
          {busy ? "Spawning…" : "Spawn"}
        </Button>
      </div>
    </ModalShell>
  );
}
