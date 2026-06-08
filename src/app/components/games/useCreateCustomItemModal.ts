import {
  itemAttributePathSchema,
  itemGeneralSkillSchema,
} from "@/app/lib/itemModifierEnums";
import {
  equipSlotCostSchema,
  itemDamageSchema,
  type ItemDamage,
} from "@/app/lib/types/item";
import { useImageUpload } from "@/hooks/use-image-upload";
import {
  getUserSafeApiError,
  getUserSafeErrorMessage,
} from "@/lib/userSafeError";
import {
  getGameCustomItemRecord,
  updateGameCustomItem,
} from "@/lib/api/customItems";
import { optionalStoredRichHtml } from "@/app/lib/tiptap/richText";
import type { CustomItemResponse } from "@/app/lib/types/item";
import { useCallback, useEffect, useState } from "react";

function optionalNumStr(value: number | null | undefined): string {
  return value != null ? String(value) : "";
}

function populateFormFromCustomItem(
  item: CustomItemResponse,
  setters: {
    setName: (v: string) => void;
    setWeight: (v: string) => void;
    setType: (v: "GENERAL_ITEM" | "WEAPON") => void;
    setDescription: (v: string) => void;
    setNotes: (v: string) => void;
    setUsage: (v: string) => void;
    setCostInfo: (v: string) => void;
    setConfCost: (v: string) => void;
    setEquippable: (v: boolean) => void;
    setEquipSlotTypes: (v: string[]) => void;
    setEquipSlotCost: (v: string) => void;
    setMaxUses: (v: string) => void;
    setModifiesAttribute: (v: string) => void;
    setAttributeMod: (v: string) => void;
    setModifiesSkill: (v: string) => void;
    setSkillMod: (v: string) => void;
    setIsSpeedAltered: (v: boolean) => void;
    setAttackRoll: (v: string[]) => void;
    setAttackMeleeBonus: (v: string) => void;
    setAttackRangeBonus: (v: string) => void;
    setAttackThrowBonus: (v: string) => void;
    setDefenceMeleeBonus: (v: string) => void;
    setDefenceRangeBonus: (v: string) => void;
    setGridAttackBonus: (v: string) => void;
    setGridDefenceBonus: (v: string) => void;
    setEffectiveRange: (v: string) => void;
    setMaxRange: (v: string) => void;
    setDamageTypes: (v: string[]) => void;
    setDamageDiceType: (v: string) => void;
    setDamageNumberOfDice: (v: string) => void;
    setImageKey: (v: string) => void;
    setRichTextSyncKey: (fn: (k: number) => number) => void;
  }
) {
  setters.setName(item.name);
  setters.setWeight(String(item.weight));
  setters.setType(item.type);
  setters.setDescription(item.description ?? "");
  setters.setNotes(item.notes ?? "");
  setters.setUsage(item.usage ?? "");
  setters.setCostInfo(item.costInfo ?? "");
  setters.setConfCost(optionalNumStr(item.confCost));
  setters.setEquippable(item.equippable ?? false);
  setters.setEquipSlotTypes(item.equipSlotTypes ?? []);
  setters.setEquipSlotCost(optionalNumStr(item.equipSlotCost));
  setters.setMaxUses(optionalNumStr(item.maxUses));
  setters.setModifiesAttribute(item.modifiesAttribute ?? "");
  setters.setAttributeMod(optionalNumStr(item.attributeMod));
  setters.setModifiesSkill(item.modifiesSkill ?? "");
  setters.setSkillMod(optionalNumStr(item.skillMod));
  setters.setIsSpeedAltered(item.isSpeedAltered ?? false);
  setters.setAttackRoll(item.attackRoll ?? []);
  setters.setAttackMeleeBonus(optionalNumStr(item.attackMeleeBonus));
  setters.setAttackRangeBonus(optionalNumStr(item.attackRangeBonus));
  setters.setAttackThrowBonus(optionalNumStr(item.attackThrowBonus));
  setters.setDefenceMeleeBonus(optionalNumStr(item.defenceMeleeBonus));
  setters.setDefenceRangeBonus(optionalNumStr(item.defenceRangeBonus));
  setters.setGridAttackBonus(optionalNumStr(item.gridAttackBonus));
  setters.setGridDefenceBonus(optionalNumStr(item.gridDefenceBonus));
  setters.setEffectiveRange(optionalNumStr(item.effectiveRange));
  setters.setMaxRange(optionalNumStr(item.maxRange));
  if (item.damage) {
    setters.setDamageTypes(item.damage.damageType ?? []);
    setters.setDamageDiceType(String(item.damage.diceType));
    setters.setDamageNumberOfDice(String(item.damage.numberOfDice));
  } else {
    setters.setDamageTypes([]);
    setters.setDamageDiceType("");
    setters.setDamageNumberOfDice("");
  }
  setters.setImageKey(item.imageKey ?? "");
  setters.setRichTextSyncKey((k) => k + 1);
}

type Args = {
  gameId: string;
  isOpen: boolean;
  editCustomItemId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function useCreateCustomItemModal({
  gameId,
  isOpen,
  editCustomItemId = null,
  onClose,
  onSuccess,
}: Args) {
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
  const [modifiesAttribute, setModifiesAttribute] = useState("");
  const [attributeMod, setAttributeMod] = useState<string>("");
  const [modifiesSkill, setModifiesSkill] = useState("");
  const [skillMod, setSkillMod] = useState<string>("");
  const [isSpeedAltered, setIsSpeedAltered] = useState(false);
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

  const imageUpload = useImageUpload("custom_items");
  const {
    imageKey,
    pendingImageKey,
    setPendingImageKey,
    setImageKey,
    deleteUploadedImage,
    handleFile,
    handleDrop,
    handleDragOver,
    reset: resetImageUpload,
  } = imageUpload;

  const [richTextSyncKey, setRichTextSyncKey] = useState(0);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(editCustomItemId);

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

  const resetForm = useCallback(() => {
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
    setModifiesAttribute("");
    setAttributeMod("");
    setModifiesSkill("");
    setSkillMod("");
    setIsSpeedAltered(false);
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
    setLoadingEdit(false);
    setRichTextSyncKey((k) => k + 1);
  }, [resetImageUpload]);

  useEffect(() => {
    if (!isOpen) return;
    if (!editCustomItemId) {
      resetForm();
      return;
    }
    let cancelled = false;
    setLoadingEdit(true);
    setError(null);
    resetImageUpload();
    void (async () => {
      try {
        const item = await getGameCustomItemRecord(gameId, editCustomItemId);
        if (cancelled) return;
        populateFormFromCustomItem(item, {
          setName,
          setWeight,
          setType,
          setDescription,
          setNotes,
          setUsage,
          setCostInfo,
          setConfCost,
          setEquippable,
          setEquipSlotTypes,
          setEquipSlotCost,
          setMaxUses,
          setModifiesAttribute,
          setAttributeMod,
          setModifiesSkill,
          setSkillMod,
          setIsSpeedAltered,
          setAttackRoll,
          setAttackMeleeBonus,
          setAttackRangeBonus,
          setAttackThrowBonus,
          setDefenceMeleeBonus,
          setDefenceRangeBonus,
          setGridAttackBonus,
          setGridDefenceBonus,
          setEffectiveRange,
          setMaxRange,
          setDamageTypes,
          setDamageDiceType,
          setDamageNumberOfDice,
          setImageKey,
          setRichTextSyncKey,
        });
      } catch (e) {
        if (!cancelled) {
          setError(getUserSafeErrorMessage(e, "Failed to load custom item."));
        }
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    editCustomItemId,
    gameId,
    resetForm,
    resetImageUpload,
    setImageKey,
  ]);

  const buildSubmitBody = (): Record<string, unknown> => {
    const weightNum = parseFloat(weight);
    const body: Record<string, unknown> = {
      name: name.trim(),
      weight: weightNum,
      type,
      attackRoll,
      description: optionalStoredRichHtml(description),
      notes: optionalStoredRichHtml(notes),
      usage: optionalStoredRichHtml(usage),
      costInfo: costInfo.trim() || undefined,
      equippable,
      equipSlotTypes: equipSlotTypes.length ? equipSlotTypes : [],
    };
    if (confCost !== "") {
      const n = parseInt(confCost, 10);
      if (!Number.isNaN(n)) body.confCost = n;
    }
    if (equipSlotCost !== "") {
      const parsed = equipSlotCostSchema.safeParse(parseInt(equipSlotCost, 10));
      if (parsed.success) body.equipSlotCost = parsed.data;
    }
    if (maxUses !== "") {
      body.maxUses = parseInt(maxUses, 10);
    }
    if (modifiesAttribute.trim()) {
      body.modifiesAttribute = itemAttributePathSchema.parse(
        modifiesAttribute.trim()
      );
    }
    if (attributeMod !== "") {
      const n = parseInt(attributeMod, 10);
      if (!Number.isNaN(n)) body.attributeMod = n;
    }
    if (modifiesSkill.trim()) {
      body.modifiesSkill = itemGeneralSkillSchema.parse(modifiesSkill.trim());
    }
    if (skillMod !== "") {
      const n = parseInt(skillMod, 10);
      if (!Number.isNaN(n)) body.skillMod = n;
    }
    body.isSpeedAltered = isSpeedAltered;
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
    return body;
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
    if (maxUses !== "") {
      const n = parseInt(maxUses, 10);
      if (!Number.isInteger(n) || n <= 0) {
        setError(
          "Max uses must be a positive integer or left blank for unlimited."
        );
        return;
      }
    }
    if (modifiesAttribute.trim()) {
      const parsedPath = itemAttributePathSchema.safeParse(
        modifiesAttribute.trim()
      );
      if (!parsedPath.success) {
        setError("Invalid attribute path for item modifier.");
        return;
      }
    }
    if (modifiesSkill.trim()) {
      const parsedSkill = itemGeneralSkillSchema.safeParse(
        modifiesSkill.trim()
      );
      if (!parsedSkill.success) {
        setError("Invalid skill for item modifier.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const body = buildSubmitBody();
      if (isEdit && editCustomItemId) {
        await updateGameCustomItem(gameId, editCustomItemId, body);
      } else {
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
      }
      setPendingImageKey("");
      onSuccess?.();
      void handleClose(true);
    } catch (e) {
      if (pendingImageKey) {
        await deleteUploadedImage(pendingImageKey);
        setPendingImageKey("");
      }
      setError(
        getUserSafeErrorMessage(
          e,
          isEdit
            ? "Failed to update custom item."
            : "Failed to create custom item."
        )
      );
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
    modifiesAttribute,
    setModifiesAttribute,
    attributeMod,
    setAttributeMod,
    modifiesSkill,
    setModifiesSkill,
    skillMod,
    setSkillMod,
    isSpeedAltered,
    setIsSpeedAltered,
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
    submitting: submitting || loadingEdit,
    loadingEdit,
    isEdit,
    error,
    handleSubmit,
    handleClose,
    richTextSyncKey,
  };
}
