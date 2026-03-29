import {
  equipSlotCostSchema,
  itemDamageSchema,
  type ItemDamage,
} from "@/app/lib/types/item";
import { useItemImageUpload } from "@/app/components/games/shared/useItemImageUpload";
import {
  getUserSafeApiError,
  getUserSafeErrorMessage,
} from "@/lib/userSafeError";
import { useState } from "react";

type Args = {
  gameId: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function useCreateCustomItemModal({ gameId, onClose, onSuccess }: Args) {
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
  const [effectiveRange, setEffectiveRange] = useState<string>("");
  const [maxRange, setMaxRange] = useState<string>("");
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

  const resetForm = () => {
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
    setEffectiveRange("");
    setMaxRange("");
    setDamageTypes([]);
    setDamageDiceType("");
    setDamageNumberOfDice("");
    resetImageUpload();
    setError(null);
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
      addNum("effectiveRange", effectiveRange);
      addNum("maxRange", maxRange);

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
    resetForm();
    onClose();
  };

  return {
    name,
    setName,
    weight,
    setWeight,
    type,
    setType,
    description,
    setDescription,
    notes,
    setNotes,
    usage,
    setUsage,
    costInfo,
    setCostInfo,
    confCost,
    setConfCost,
    equippable,
    setEquippable,
    equipSlotTypes,
    equipSlotCost,
    setEquipSlotCost,
    maxUses,
    setMaxUses,
    attackRoll,
    attackMeleeBonus,
    setAttackMeleeBonus,
    attackRangeBonus,
    setAttackRangeBonus,
    attackThrowBonus,
    setAttackThrowBonus,
    defenceMeleeBonus,
    setDefenceMeleeBonus,
    defenceRangeBonus,
    setDefenceRangeBonus,
    gridAttackBonus,
    setGridAttackBonus,
    gridDefenceBonus,
    setGridDefenceBonus,
    effectiveRange,
    setEffectiveRange,
    maxRange,
    setMaxRange,
    damageTypes,
    damageDiceType,
    setDamageDiceType,
    damageNumberOfDice,
    setDamageNumberOfDice,
    toggleAttackRoll,
    toggleEquipSlot,
    toggleDamageType,
    imageUpload,
    imageKey,
    handleFile,
    handleDrop,
    handleDragOver,
    submitting,
    error,
    handleSubmit,
    handleClose,
  };
}
