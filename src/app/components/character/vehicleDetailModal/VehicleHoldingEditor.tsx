"use client";

import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { NumberField } from "@/app/components/shared/NumberField";
import { TextField } from "@/app/components/shared/TextField";
import { updateCharacterVehicleEntry } from "@/lib/api/vehicles";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useState } from "react";

type VehicleHoldingEditorProps = {
  characterId: string;
  vehicleCharacterId: string;
  nickname: string;
  maxHpBonus: number;
  disabled: boolean;
  mutate: () => Promise<unknown>;
};

export function VehicleHoldingEditor({
  characterId,
  vehicleCharacterId,
  nickname,
  maxHpBonus,
  disabled,
  mutate,
}: VehicleHoldingEditorProps) {
  const [nicknameDraft, setNicknameDraft] = useState(nickname);
  const [bonusDraft, setBonusDraft] = useState(String(maxHpBonus));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = disabled || busy;

  const saveNickname = async () => {
    const next = nicknameDraft.trim();
    if (next === nickname.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await updateCharacterVehicleEntry(characterId, vehicleCharacterId, {
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

  const saveBonus = async (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setBonusDraft(String(maxHpBonus));
      return;
    }
    if (parsed === maxHpBonus) {
      setBonusDraft(String(maxHpBonus));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateCharacterVehicleEntry(characterId, vehicleCharacterId, {
        action: "setMaxHpBonus",
        maxHpBonus: parsed,
      });
      await mutate();
      setBonusDraft(String(parsed));
    } catch (e) {
      setBonusDraft(String(maxHpBonus));
      setError(getUserSafeErrorMessage(e, "Failed to update max HP bonus"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FieldLabel
          id={`vehicle-nickname-${vehicleCharacterId}`}
          label="Nickname"
        />
        <TextField
          id={`vehicle-nickname-${vehicleCharacterId}`}
          variant="dark"
          value={nicknameDraft}
          disabled={locked}
          onChange={(e) => setNicknameDraft(e.target.value)}
          onBlur={() => void saveNickname()}
        />
      </div>
      <div>
        <FieldLabel
          id={`vehicle-max-hp-bonus-${vehicleCharacterId}`}
          label="Max HP bonus"
          required
        />
        <NumberField
          id={`vehicle-max-hp-bonus-${vehicleCharacterId}`}
          variant="dark"
          value={bonusDraft}
          disabled={locked}
          onChange={setBonusDraft}
          onBlur={() => void saveBonus(bonusDraft)}
        />
      </div>
      {error ? (
        <p className="sm:col-span-2 text-xs text-neblirDanger-300">{error}</p>
      ) : null}
    </div>
  );
}
