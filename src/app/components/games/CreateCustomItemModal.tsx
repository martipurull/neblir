"use client";

import {
  equipSlotCostSchema,
  itemDamageSchema,
  type ItemDamage,
} from "@/app/lib/types/item";
import { ImageUploadDropzone } from "@/app/components/games/shared/ImageUploadDropzone";
import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import {
  modalInputClass,
  modalSelectClass,
} from "@/app/components/games/shared/modalStyles";
import { useItemImageUpload } from "@/app/components/games/shared/useItemImageUpload";
import {
  getUserSafeApiError,
  getUserSafeErrorMessage,
} from "@/lib/userSafeError";
import React, { useState } from "react";

const ITEM_TYPES = [
  { value: "GENERAL_ITEM", label: "General item" },
  { value: "WEAPON", label: "Weapon" },
] as const;

const ATTACK_ROLL_TYPES = [
  { value: "RANGE", label: "Range" },
  { value: "MELEE", label: "Melee" },
  { value: "GRID", label: "Grid" },
  { value: "THROW", label: "Throw" },
] as const;

const DAMAGE_TYPES = [
  "BULLET",
  "BLADE",
  "SIIKE",
  "ACID",
  "FIRE",
  "ICE",
  "BLUDGEONING",
  "ELECTRICITY",
  "NERVE",
  "POISON",
  "OTHER",
] as const;

const EQUIP_SLOTS = [
  { value: "HAND", label: "Hand" },
  { value: "FOOT", label: "Foot" },
  { value: "BODY", label: "Body" },
  { value: "HEAD", label: "Head" },
] as const;

type CreateCustomItemModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function CreateCustomItemModal({
  isOpen,
  gameId,
  gameName,
  onClose,
  onSuccess,
}: CreateCustomItemModalProps) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState<string>("");
  const [type, setType] = useState<"GENERAL_ITEM" | "WEAPON">("GENERAL_ITEM");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [usage, setUsage] = useState("");
  const [costInfo, setCostInfo] = useState("");
  const [confCost, setConfCost] = useState<string>("");
  const [equippable, setEquippable] = useState(false);
  const [equipSlotTypes, setEquipSlotTypes] = useState<string[]>([]);
  const [equipSlotCost, setEquipSlotCost] = useState<string>("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [attackRoll, setAttackRoll] = useState<string[]>([]);
  const [attackMeleeBonus, setAttackMeleeBonus] = useState<string>("");
  const [attackRangeBonus, setAttackRangeBonus] = useState<string>("");
  const [attackThrowBonus, setAttackThrowBonus] = useState<string>("");
  const [defenceMeleeBonus, setDefenceMeleeBonus] = useState<string>("");
  const [defenceRangeBonus, setDefenceRangeBonus] = useState<string>("");
  const [gridAttackBonus, setGridAttackBonus] = useState<string>("");
  const [gridDefenceBonus, setGridDefenceBonus] = useState<string>("");
  const [damageTypes, setDamageTypes] = useState<string[]>([]);
  const [damageDiceType, setDamageDiceType] = useState<string>("");
  const [damageNumberOfDice, setDamageNumberOfDice] = useState<string>("");

  const imageUpload = useItemImageUpload("custom_items");
  const {
    imageKey,
    pendingImageKey,
    setPendingImageKey,
    deleteUploadedImage,
    handleFile,
    handleDrop,
    handleDragOver,
    reset: resetImageUpload,
  } = imageUpload;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAttackRoll = (value: string) => {
    setAttackRoll((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const toggleEquipSlot = (value: string) => {
    setEquipSlotTypes((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const toggleDamageType = (value: string) => {
    setDamageTypes((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const buildDamage = (): ItemDamage | undefined => {
    if (damageTypes.length === 0 || !damageDiceType || !damageNumberOfDice)
      return undefined;
    const diceType = parseInt(damageDiceType, 10);
    const numberOfDice = parseInt(damageNumberOfDice, 10);
    if (
      Number.isNaN(diceType) ||
      Number.isNaN(numberOfDice) ||
      numberOfDice < 1
    )
      return undefined;
    const parsed = itemDamageSchema.safeParse({
      damageType: damageTypes,
      diceType,
      numberOfDice,
    });
    return parsed.success ? parsed.data : undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const weightNum = parseFloat(weight);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (weight === "" || Number.isNaN(weightNum) || weightNum < 0) {
      setError("Weight is required and must be a non‑negative number.");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        weight: weightNum,
        type,
        attackRoll,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        usage: usage.trim() || undefined,
        costInfo: costInfo.trim() || undefined,
        equippable: equippable || undefined,
        equipSlotTypes: equipSlotTypes.length ? equipSlotTypes : undefined,
      };
      if (confCost !== "") {
        const n = parseInt(confCost, 10);
        if (!Number.isNaN(n)) body.confCost = n;
      }
      if (equipSlotCost !== "") {
        const parsed = equipSlotCostSchema.safeParse(
          parseInt(equipSlotCost, 10)
        );
        if (parsed.success) body.equipSlotCost = parsed.data;
      }
      if (maxUses !== "") {
        const n = parseInt(maxUses, 10);
        if (Number.isInteger(n) && n > 0) body.maxUses = n;
      }
      const addNum = (key: string, val: string) => {
        const n = parseInt(val, 10);
        if (val !== "" && !Number.isNaN(n))
          (body as Record<string, number>)[key] = n;
      };
      addNum("attackMeleeBonus", attackMeleeBonus);
      addNum("attackRangeBonus", attackRangeBonus);
      addNum("attackThrowBonus", attackThrowBonus);
      addNum("defenceMeleeBonus", defenceMeleeBonus);
      addNum("defenceRangeBonus", defenceRangeBonus);
      addNum("gridAttackBonus", gridAttackBonus);
      addNum("gridDefenceBonus", gridDefenceBonus);

      const damage = buildDamage();
      if (damage) body.damage = damage;
      if (imageKey) body.imageKey = imageKey;

      const res = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/custom-items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        if (pendingImageKey) {
          await deleteUploadedImage(pendingImageKey);
          setPendingImageKey("");
        }
        setError(
          getUserSafeApiError(
            res.status,
            data as { message?: string; details?: string },
            "Failed to create custom item."
          )
        );
        return;
      }
      setPendingImageKey("");
      onSuccess?.();
      void handleClose(true);
    } catch (e) {
      if (pendingImageKey) {
        await deleteUploadedImage(pendingImageKey);
        setPendingImageKey("");
      }
      setError(getUserSafeErrorMessage(e, "Failed to create custom item."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (skipCleanup?: boolean) => {
    if (!skipCleanup && pendingImageKey) {
      await deleteUploadedImage(pendingImageKey);
    }
    setName("");
    setWeight("");
    setType("GENERAL_ITEM");
    setDescription("");
    setNotes("");
    setUsage("");
    setCostInfo("");
    setConfCost("");
    setEquippable(false);
    setEquipSlotTypes([]);
    setEquipSlotCost("");
    setMaxUses("");
    setAttackRoll([]);
    setAttackMeleeBonus("");
    setAttackRangeBonus("");
    setAttackThrowBonus("");
    setDefenceMeleeBonus("");
    setDefenceRangeBonus("");
    setGridAttackBonus("");
    setGridDefenceBonus("");
    setDamageTypes([]);
    setDamageDiceType("");
    setDamageNumberOfDice("");
    resetImageUpload();
    setError(null);
    onClose();
  };

  return (
    <GameFormModal
      isOpen={isOpen}
      title={`Create custom item — ${gameName}`}
      subtitle={
        <>
          Fields marked with <span className="text-neblirDanger-400">*</span>{" "}
          are required. Optional fields can be left blank.
        </>
      }
      titleId="create-custom-item-title"
      error={error}
      onClose={() => void handleClose()}
      onSubmit={(e) => void handleSubmit(e)}
      submitting={submitting}
      submitLabel="Create custom item"
      submittingLabel="Creating…"
    >
      {/* Basics */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">Basics</h3>
        <div className="space-y-3">
          <div>
            <ModalFieldLabel id="custom-item-name" label="Name" required />
            <input
              id="custom-item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={modalInputClass}
              placeholder="e.g. Combat knife"
              disabled={submitting}
            />
          </div>
          <div>
            <ModalFieldLabel id="custom-item-weight" label="Weight" required />
            <input
              id="custom-item-weight"
              type="number"
              min={0}
              step={0.1}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={modalInputClass}
              placeholder="0"
              disabled={submitting}
            />
          </div>
          <div>
            <ModalFieldLabel id="custom-item-type" label="Type" />
            <select
              id="custom-item-type"
              value={type}
              onChange={(e) =>
                setType(e.target.value as "GENERAL_ITEM" | "WEAPON")
              }
              className={modalSelectClass}
              disabled={submitting}
            >
              {ITEM_TYPES.map((t) => (
                <option
                  key={t.value}
                  value={t.value}
                  className="bg-modalBackground-200 text-black"
                >
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Optional text */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">
          Description &amp; usage
        </h3>
        <div className="space-y-3">
          <div>
            <ModalFieldLabel id="custom-item-description" label="Description" />
            <textarea
              id="custom-item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={modalInputClass + " min-h-[80px]"}
              placeholder="Item description"
              disabled={submitting}
              rows={3}
            />
          </div>
          <div>
            <ModalFieldLabel id="custom-item-usage" label="Usage" />
            <input
              id="custom-item-usage"
              type="text"
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              className={modalInputClass}
              placeholder="e.g. One use per round"
              disabled={submitting}
            />
          </div>
          <div>
            <ModalFieldLabel id="custom-item-notes" label="Notes" />
            <input
              id="custom-item-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={modalInputClass}
              placeholder="GM notes"
              disabled={submitting}
            />
          </div>
          <div>
            <ModalFieldLabel id="custom-item-cost-info" label="Cost info" />
            <input
              id="custom-item-cost-info"
              type="text"
              value={costInfo}
              onChange={(e) => setCostInfo(e.target.value)}
              className={modalInputClass}
              placeholder="e.g. Not for sale"
              disabled={submitting}
            />
          </div>
          <div>
            <ModalFieldLabel id="custom-item-conf-cost" label="Conf cost" />
            <input
              id="custom-item-conf-cost"
              type="number"
              min={0}
              value={confCost}
              onChange={(e) => setConfCost(e.target.value)}
              className={modalInputClass}
              placeholder="0"
              disabled={submitting}
            />
          </div>
        </div>
      </section>

      {/* Combat (weapon) */}
      {type === "WEAPON" && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-white/90">
            Weapon &amp; combat
          </h3>
          <div className="space-y-3">
            <div>
              <ModalFieldLabel
                id="custom-item-attack-roll"
                label="Attack roll types"
              />
              <div className="flex flex-wrap gap-2">
                {ATTACK_ROLL_TYPES.map((t) => (
                  <label
                    key={t.value}
                    className="flex cursor-pointer items-center gap-1.5 text-sm text-white"
                  >
                    <input
                      type="checkbox"
                      checked={attackRoll.includes(t.value)}
                      onChange={() => toggleAttackRoll(t.value)}
                      disabled={submitting}
                      className="rounded border-white/50"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <ModalFieldLabel
                  id="custom-item-melee-bonus"
                  label="Melee bonus"
                />
                <input
                  id="custom-item-melee-bonus"
                  type="number"
                  value={attackMeleeBonus}
                  onChange={(e) => setAttackMeleeBonus(e.target.value)}
                  className={modalInputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <ModalFieldLabel
                  id="custom-item-range-bonus"
                  label="Range bonus"
                />
                <input
                  id="custom-item-range-bonus"
                  type="number"
                  value={attackRangeBonus}
                  onChange={(e) => setAttackRangeBonus(e.target.value)}
                  className={modalInputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <ModalFieldLabel
                  id="custom-item-throw-bonus"
                  label="Throw bonus"
                />
                <input
                  id="custom-item-throw-bonus"
                  type="number"
                  value={attackThrowBonus}
                  onChange={(e) => setAttackThrowBonus(e.target.value)}
                  className={modalInputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <ModalFieldLabel
                  id="custom-item-grid-attack"
                  label="Grid attack"
                />
                <input
                  id="custom-item-grid-attack"
                  type="number"
                  value={gridAttackBonus}
                  onChange={(e) => setGridAttackBonus(e.target.value)}
                  className={modalInputClass}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <ModalFieldLabel
                  id="custom-item-defence-melee"
                  label="Defence melee"
                />
                <input
                  id="custom-item-defence-melee"
                  type="number"
                  value={defenceMeleeBonus}
                  onChange={(e) => setDefenceMeleeBonus(e.target.value)}
                  className={modalInputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <ModalFieldLabel
                  id="custom-item-defence-range"
                  label="Defence range"
                />
                <input
                  id="custom-item-defence-range"
                  type="number"
                  value={defenceRangeBonus}
                  onChange={(e) => setDefenceRangeBonus(e.target.value)}
                  className={modalInputClass}
                  disabled={submitting}
                />
              </div>
              <div>
                <ModalFieldLabel
                  id="custom-item-grid-defence"
                  label="Grid defence"
                />
                <input
                  id="custom-item-grid-defence"
                  type="number"
                  value={gridDefenceBonus}
                  onChange={(e) => setGridDefenceBonus(e.target.value)}
                  className={modalInputClass}
                  disabled={submitting}
                />
              </div>
            </div>
            <div>
              <ModalFieldLabel
                id="custom-item-damage-types"
                label="Damage types"
              />
              <div className="flex flex-wrap gap-2">
                {DAMAGE_TYPES.map((d) => (
                  <label
                    key={d}
                    className="flex cursor-pointer items-center gap-1.5 text-xs text-white"
                  >
                    <input
                      type="checkbox"
                      checked={damageTypes.includes(d)}
                      onChange={() => toggleDamageType(d)}
                      disabled={submitting}
                      className="rounded border-white/50"
                    />
                    {d}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <ModalFieldLabel id="custom-item-dice-type" label="Dice type" />
                <input
                  id="custom-item-dice-type"
                  type="number"
                  min={1}
                  value={damageDiceType}
                  onChange={(e) => setDamageDiceType(e.target.value)}
                  className={modalInputClass}
                  placeholder="e.g. 6"
                  disabled={submitting}
                />
              </div>
              <div>
                <ModalFieldLabel
                  id="custom-item-number-dice"
                  label="Number of dice"
                />
                <input
                  id="custom-item-number-dice"
                  type="number"
                  min={1}
                  value={damageNumberOfDice}
                  onChange={(e) => setDamageNumberOfDice(e.target.value)}
                  className={modalInputClass}
                  placeholder="e.g. 2"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Equippable */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">Equippable</h3>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={equippable}
              onChange={(e) => setEquippable(e.target.checked)}
              disabled={submitting}
              className="rounded border-white/50"
            />
            Can be equipped
          </label>
          {equippable && (
            <>
              <div>
                <ModalFieldLabel
                  id="custom-item-equip-slots"
                  label="Equip slots"
                />
                <div className="flex flex-wrap gap-2">
                  {EQUIP_SLOTS.map((s) => (
                    <label
                      key={s.value}
                      className="flex cursor-pointer items-center gap-1.5 text-sm text-white"
                    >
                      <input
                        type="checkbox"
                        checked={equipSlotTypes.includes(s.value)}
                        onChange={() => toggleEquipSlot(s.value)}
                        disabled={submitting}
                        className="rounded border-white/50"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <ModalFieldLabel
                  id="custom-item-equip-slot-cost"
                  label="Equip slot cost (0, 1, or 2)"
                />
                <input
                  id="custom-item-equip-slot-cost"
                  type="number"
                  min={0}
                  max={2}
                  value={equipSlotCost}
                  onChange={(e) => setEquipSlotCost(e.target.value)}
                  className={modalInputClass}
                  disabled={submitting}
                />
              </div>
            </>
          )}
          <div>
            <ModalFieldLabel id="custom-item-max-uses" label="Max uses" />
            <input
              id="custom-item-max-uses"
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className={modalInputClass}
              placeholder="Leave empty for unlimited"
              disabled={submitting}
            />
          </div>
        </div>
      </section>

      <ImageUploadDropzone
        id="custom-item-image"
        label="Image"
        imageKey={imageKey}
        onFileChange={(file) => void handleFile(file)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        uploading={imageUpload.uploading}
        error={imageUpload.uploadError}
        disabled={submitting}
      />
    </GameFormModal>
  );
}
