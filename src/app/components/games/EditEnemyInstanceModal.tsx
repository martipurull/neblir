"use client";

import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { GameModalRichTextField } from "@/app/components/games/shared/GameModalRichTextField";
import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { darkSelectClassName } from "@/app/components/shared/darkInputStyles";
import { TextField } from "@/app/components/shared/TextField";
import { useImageUpload } from "@/hooks/use-image-upload";
import type { EnemyInstanceDetailResponse } from "@/lib/api/enemyInstances";
import { updateEnemyInstance } from "@/lib/api/enemyInstances";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useCallback, useEffect, useState } from "react";

type EnemyInstanceStatus = "ACTIVE" | "DEFEATED" | "DEAD";

export type EditEnemyInstanceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  enemy: EnemyInstanceDetailResponse;
  onSaved: () => void | Promise<void>;
};

export function EditEnemyInstanceModal({
  isOpen,
  onClose,
  gameId,
  enemy,
  onSaved,
}: EditEnemyInstanceModalProps) {
  const [name, setName] = useState("");
  const [maxHealth, setMaxHealth] = useState(1);
  const [currentHealth, setCurrentHealth] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [initiativeModifier, setInitiativeModifier] = useState(0);
  const [reactionsPerRound, setReactionsPerRound] = useState(0);
  const [status, setStatus] = useState<EnemyInstanceStatus>("ACTIVE");
  const [knownToPlayers, setKnownToPlayers] = useState(true);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [richTextSyncKey, setRichTextSyncKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageUpload = useImageUpload("custom_enemies");

  useEffect(() => {
    if (!isOpen) return;
    setName(enemy.name);
    setMaxHealth(enemy.maxHealth);
    setCurrentHealth(enemy.currentHealth);
    setSpeed(enemy.speed);
    setInitiativeModifier(enemy.initiativeModifier);
    setReactionsPerRound(enemy.reactionsPerRound);
    setStatus(enemy.status);
    setKnownToPlayers(enemy.isPublic !== false);
    setDescription(enemy.description ?? "");
    setNotes(enemy.notes ?? "");
    setError(null);
    imageUpload.reset();
    if (enemy.imageKey) {
      imageUpload.setImageKey(enemy.imageKey);
    }
    setRichTextSyncKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    enemy.id,
    enemy.name,
    enemy.maxHealth,
    enemy.currentHealth,
    enemy.speed,
    enemy.initiativeModifier,
    enemy.reactionsPerRound,
    enemy.status,
    enemy.isPublic,
    enemy.description,
    enemy.notes,
    enemy.imageKey,
  ]);

  const handleClose = useCallback(() => {
    if (busy) return;
    const initialKey = enemy.imageKey ?? "";
    const pending = imageUpload.pendingImageKey;
    if (pending && pending !== initialKey) {
      void imageUpload.deleteUploadedImage(pending);
    }
    imageUpload.reset();
    onClose();
  }, [busy, enemy.imageKey, imageUpload, onClose]);

  const handleSave = async () => {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    if (currentHealth > maxHealth) {
      setError("Current HP cannot exceed max HP.");
      return;
    }
    if (currentHealth === 0 && status === "ACTIVE") {
      setError("When current HP is 0, set status to Defeated or Dead.");
      return;
    }
    setBusy(true);
    try {
      const patch: Parameters<typeof updateEnemyInstance>[2] = {
        name: trimmed,
        maxHealth,
        currentHealth,
        speed,
        initiativeModifier,
        reactionsPerRound,
        status,
        isPublic: knownToPlayers,
        description: description.trim() ? description : null,
        notes: notes.trim() ? notes : "",
      };
      const nextKey = imageUpload.imageKey.trim();
      const prevKey = enemy.imageKey ?? "";
      if (nextKey !== prevKey) {
        patch.imageKey = nextKey.length > 0 ? nextKey : null;
      }
      await updateEnemyInstance(gameId, enemy.id, patch);
      await Promise.resolve(onSaved());
      imageUpload.reset();
      onClose();
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Could not save changes."));
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={handleClose}
      title={`Edit — ${enemy.name}`}
      titleId="edit-enemy-instance-title"
      maxWidthClass="max-w-lg"
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="modalFooterSecondary"
            fullWidth={false}
            disabled={busy}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="modalFooterPrimary"
            fullWidth={false}
            disabled={busy}
            onClick={() => void handleSave()}
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-sm text-white">
        <p className="text-xs text-white/75">
          Adjust this instance (name, portrait, HP pool, speed, initiative
          modifier on the sheet, reactions, status, rich text fields).
          Initiative <strong>order</strong> for this game is edited on the
          instance page or GM initiative list, not here.
        </p>

        <Checkbox
          checked={knownToPlayers}
          onChange={setKnownToPlayers}
          tone="inverse"
          disabled={busy}
          label={<span className="text-white/90">Known to players?</span>}
        />
        <p className="text-xs text-white/65">
          Private instances are hidden from players in game data; Discord rolls
          default to secret.
        </p>

        <div>
          <FieldLabel id="edit-enemy-instance-name" label="Name" required />
          <TextField
            id="edit-enemy-instance-name"
            type="text"
            variant="dark"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />
        </div>

        <ImageUploadDropzone
          id="edit-enemy-instance-image"
          label="Image"
          imageKey={imageUpload.imageKey}
          onFileChange={(file) => void imageUpload.handleFile(file)}
          onDrop={imageUpload.handleDrop}
          onDragOver={imageUpload.handleDragOver}
          uploading={imageUpload.uploading}
          error={imageUpload.uploadError}
          disabled={busy}
          previewLayout="roundAvatar"
          previewImageAlt={
            name.trim() ? `${name.trim()} avatar` : "Enemy avatar"
          }
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <ModalNumberField
            id="edit-enemy-max-hp"
            label="Max HP"
            value={String(maxHealth)}
            onChange={(v) =>
              setMaxHealth(Math.max(1, Math.trunc(Number(v) || 1)))
            }
            disabled={busy}
            min={1}
          />
          <ModalNumberField
            id="edit-enemy-current-hp"
            label="Current HP"
            value={String(currentHealth)}
            onChange={(v) =>
              setCurrentHealth(Math.max(0, Math.trunc(Number(v) || 0)))
            }
            disabled={busy}
            min={0}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ModalNumberField
            id="edit-enemy-speed"
            label="Speed"
            value={String(speed)}
            onChange={(v) => setSpeed(Math.max(0, Math.trunc(Number(v) || 0)))}
            disabled={busy}
            min={0}
          />
          <ModalNumberField
            id="edit-enemy-initiative"
            label="Initiative modifier (stat block)"
            value={String(initiativeModifier)}
            onChange={(v) => setInitiativeModifier(Math.trunc(Number(v) || 0))}
            disabled={busy}
            required={false}
          />
        </div>

        <ModalNumberField
          id="edit-enemy-reactions"
          label="Reactions per round"
          value={String(reactionsPerRound)}
          onChange={(v) =>
            setReactionsPerRound(Math.max(0, Math.trunc(Number(v) || 0)))
          }
          disabled={busy}
          min={0}
        />

        <div>
          <FieldLabel id="edit-enemy-instance-status" label="Status" required />
          <select
            id="edit-enemy-instance-status"
            className={darkSelectClassName}
            value={status}
            onChange={(e) => setStatus(e.target.value as EnemyInstanceStatus)}
            disabled={busy}
          >
            <option value="ACTIVE">Active</option>
            <option value="DEFEATED">Defeated</option>
            <option value="DEAD">Dead</option>
          </select>
          <p className="mt-1 text-xs text-white/55">
            At 0 HP, choose Defeated or Dead (not Active).
          </p>
        </div>

        <GameModalRichTextField
          id="edit-enemy-instance-description"
          label="Description"
          value={description}
          onChange={setDescription}
          disabled={busy}
          syncKey={richTextSyncKey}
        />

        <GameModalRichTextField
          id="edit-enemy-instance-notes"
          label="GM notes"
          value={notes}
          onChange={setNotes}
          disabled={busy}
          syncKey={richTextSyncKey}
        />

        {error ? (
          <p className="text-sm text-neblirDanger-300">{error}</p>
        ) : null}
      </div>
    </ModalShell>
  );
}
