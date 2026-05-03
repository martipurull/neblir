"use client";

import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { GameModalRichTextField } from "@/app/components/games/shared/GameModalRichTextField";
import { ImageUploadDropzone } from "@/app/components/games/shared/ImageUploadDropzone";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { modalInputClass } from "@/app/components/games/shared/modalStyles";
import { useItemImageUpload } from "@/app/components/games/shared/useItemImageUpload";
import type { EnemyInstanceDetailResponse } from "@/lib/api/enemyInstances";
import { updateEnemyInstance } from "@/lib/api/enemyInstances";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useCallback, useEffect, useState } from "react";

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
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [richTextSyncKey, setRichTextSyncKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageUpload = useItemImageUpload("custom_enemies");

  useEffect(() => {
    if (!isOpen) return;
    setName(enemy.name);
    setMaxHealth(enemy.maxHealth);
    setCurrentHealth(enemy.currentHealth);
    setSpeed(enemy.speed);
    setInitiativeModifier(enemy.initiativeModifier);
    setReactionsPerRound(enemy.reactionsPerRound);
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
    setBusy(true);
    try {
      const patch: Parameters<typeof updateEnemyInstance>[2] = {
        name: trimmed,
        maxHealth,
        currentHealth,
        speed,
        initiativeModifier,
        reactionsPerRound,
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
          modifier on the sheet, reactions, rich text fields). Initiative{" "}
          <strong>order</strong> for this game is edited on the instance page or
          GM initiative list, not here.
        </p>

        <div>
          <ModalFieldLabel
            id="edit-enemy-instance-name"
            label="Name"
            required
          />
          <input
            id="edit-enemy-instance-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={modalInputClass}
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
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Max HP
            </span>
            <input
              type="number"
              min={1}
              value={maxHealth}
              onChange={(e) =>
                setMaxHealth(
                  Math.max(1, Math.trunc(Number(e.target.value) || 1))
                )
              }
              className={modalInputClass}
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Current HP
            </span>
            <input
              type="number"
              min={0}
              value={currentHealth}
              onChange={(e) =>
                setCurrentHealth(
                  Math.max(0, Math.trunc(Number(e.target.value) || 0))
                )
              }
              className={modalInputClass}
              disabled={busy}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Speed
            </span>
            <input
              type="number"
              min={0}
              value={speed}
              onChange={(e) =>
                setSpeed(Math.max(0, Math.trunc(Number(e.target.value) || 0)))
              }
              className={modalInputClass}
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Initiative modifier (stat block)
            </span>
            <input
              type="number"
              value={initiativeModifier}
              onChange={(e) =>
                setInitiativeModifier(Math.trunc(Number(e.target.value) || 0))
              }
              className={modalInputClass}
              disabled={busy}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Reactions per round
          </span>
          <input
            type="number"
            min={0}
            value={reactionsPerRound}
            onChange={(e) =>
              setReactionsPerRound(
                Math.max(0, Math.trunc(Number(e.target.value) || 0))
              )
            }
            className={modalInputClass}
            disabled={busy}
          />
        </label>

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
