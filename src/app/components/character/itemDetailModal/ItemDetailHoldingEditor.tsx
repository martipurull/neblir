"use client";

import { Button } from "@/app/components/shared/Button";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { NumberField } from "@/app/components/shared/NumberField";
import { TextField } from "@/app/components/shared/TextField";
import { MAX_STACK_QUANTITY } from "@/app/lib/constants/inventory";
import { updateCharacterInventoryEntry } from "@/lib/api/items";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useState } from "react";

type ItemDetailHoldingEditorProps = {
  characterId: string;
  itemCharacterId: string;
  nickname: string;
  quantity: number;
  mutate: () => Promise<unknown>;
  onHoldingRemoved: () => void;
};

export function ItemDetailHoldingEditor({
  characterId,
  itemCharacterId,
  nickname,
  quantity,
  mutate,
  onHoldingRemoved,
}: ItemDetailHoldingEditorProps) {
  const [nicknameDraft, setNicknameDraft] = useState(nickname);
  const [quantityDraft, setQuantityDraft] = useState(String(quantity));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const saveNickname = async () => {
    const next = nicknameDraft.trim();
    const current = nickname.trim();
    if (next === current) return;
    setBusy(true);
    setError(null);
    try {
      await updateCharacterInventoryEntry(characterId, itemCharacterId, {
        action: "setCustomName",
        customName: next.length > 0 ? next : null,
      });
      await mutate();
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to update nickname"));
    } finally {
      setBusy(false);
    }
  };

  const saveQuantity = async (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setQuantityDraft(String(quantity));
      return;
    }
    const next = Math.min(MAX_STACK_QUANTITY, parsed);
    if (next === quantity) {
      setQuantityDraft(String(quantity));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await updateCharacterInventoryEntry(
        characterId,
        itemCharacterId,
        { action: "setQuantity", quantity: next }
      );
      await mutate();
      if (updated == null || next === 0) {
        onHoldingRemoved();
        return;
      }
      setQuantityDraft(String(next));
    } catch (e) {
      setQuantityDraft(String(quantity));
      setError(getUserSafeErrorMessage(e, "Failed to update quantity"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <FieldLabel id={`item-nickname-${itemCharacterId}`} label="Nickname" />
        <TextField
          id={`item-nickname-${itemCharacterId}`}
          variant="dark"
          value={nicknameDraft}
          disabled={busy}
          onChange={(e) => setNicknameDraft(e.target.value)}
          onBlur={() => void saveNickname()}
        />
      </div>
      <div>
        <FieldLabel
          id={`item-quantity-${itemCharacterId}`}
          label="Quantity"
          required
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="modalIconStepperCompact"
            fullWidth={false}
            disabled={busy || quantity <= 0}
            aria-label="Decrease quantity"
            onClick={() => void saveQuantity(String(quantity - 1))}
          >
            −
          </Button>
          <NumberField
            id={`item-quantity-${itemCharacterId}`}
            variant="dark"
            density="compact"
            min={0}
            max={MAX_STACK_QUANTITY}
            value={quantityDraft}
            disabled={busy}
            onChange={setQuantityDraft}
            onBlur={() => void saveQuantity(quantityDraft)}
          />
          <Button
            type="button"
            variant="modalIconStepperCompact"
            fullWidth={false}
            disabled={busy || quantity >= MAX_STACK_QUANTITY}
            aria-label="Increase quantity"
            onClick={() => void saveQuantity(String(quantity + 1))}
          >
            +
          </Button>
        </div>
      </div>
      {error ? <p className="text-xs text-neblirDanger-300">{error}</p> : null}
    </div>
  );
}
