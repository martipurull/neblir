import type { ItemWithId } from "@/lib/api/items";
import {
  equipSlotCostSchema,
  itemDamageSchema,
  type UniqueItemCreate,
  type ItemDamage,
} from "@/app/lib/types/item";
import {
  itemWithIdToBrowseDetail,
  type ItemBrowseDetailFields,
} from "@/app/lib/types/itemBrowseDetail";
import { useItemImageUpload } from "@/app/components/games/shared/useItemImageUpload";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useCallback, useEffect, useMemo, useState } from "react";
import { templateOptionLabel } from "./uniqueItemModalTypes";

type Args = {
  isOpen: boolean;
  customTemplateGameIds: string[];
  gameIdForSubmit?: string;
  submitEndpoint?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function useCreateUniqueItemModal({
  isOpen,
  customTemplateGameIds,
  gameIdForSubmit,
  submitEndpoint,
  onClose,
  onSuccess,
}: Args) {
  const [sourceType, setSourceType] = useState<
    "GLOBAL_ITEM" | "CUSTOM_ITEM" | "STANDALONE"
  >("GLOBAL_ITEM");
  const [selectedTemplate, setSelectedTemplate] = useState<
    ItemWithId | ItemBrowseDetailFields | null
  >(null);
  const [globalItems, setGlobalItems] = useState<ItemWithId[]>([]);
  const [customTemplateBrowseItems, setCustomTemplateBrowseItems] = useState<
    ItemBrowseDetailFields[]
  >([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const [nameOverride, setNameOverride] = useState("");
  const [descriptionOverride, setDescriptionOverride] = useState("");
  const [notesOverride, setNotesOverride] = useState("");
  const [usageOverride, setUsageOverride] = useState("");
  const [costInfoOverride, setCostInfoOverride] = useState("");
  const [confCostOverride, setConfCostOverride] = useState("");
  const [weightOverride, setWeightOverride] = useState("");
  const [specialTag, setSpecialTag] = useState("");
  const [equippableOverride, setEquippableOverride] = useState<boolean | "">(
    ""
  );
  const [equipSlotTypesOverride, setEquipSlotTypesOverride] = useState<
    string[]
  >([]);
  const [equipSlotCostOverride, setEquipSlotCostOverride] = useState("");
  const [maxUsesOverride, setMaxUsesOverride] = useState("");
  const [attackRollOverride, setAttackRollOverride] = useState<string[]>([]);
  const [attackMeleeBonusOverride, setAttackMeleeBonusOverride] = useState("");
  const [attackRangeBonusOverride, setAttackRangeBonusOverride] = useState("");
  const [attackThrowBonusOverride, setAttackThrowBonusOverride] = useState("");
  const [defenceMeleeBonusOverride, setDefenceMeleeBonusOverride] =
    useState("");
  const [defenceRangeBonusOverride, setDefenceRangeBonusOverride] =
    useState("");
  const [gridAttackBonusOverride, setGridAttackBonusOverride] = useState("");
  const [gridDefenceBonusOverride, setGridDefenceBonusOverride] = useState("");
  const [effectiveRangeOverride, setEffectiveRangeOverride] = useState("");
  const [maxRangeOverride, setMaxRangeOverride] = useState("");
  const [damageTypesOverride, setDamageTypesOverride] = useState<string[]>([]);
  const [damageDiceTypeOverride, setDamageDiceTypeOverride] = useState("");
  const [damageNumberOfDiceOverride, setDamageNumberOfDiceOverride] =
    useState("");

  const imageUpload = useItemImageUpload("unique_items");
  const {
    imageKey: imageKeyOverride,
    pendingImageKey,
    setPendingImageKey,
    deleteUploadedImage,
    handleFile: handleImageFile,
    handleDrop: handleImageDrop,
    handleDragOver: handleImageDragOver,
    reset: resetImageUpload,
  } = imageUpload;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templates = useMemo(
    () =>
      sourceType === "GLOBAL_ITEM"
        ? globalItems
        : sourceType === "CUSTOM_ITEM"
          ? customTemplateBrowseItems
          : [],
    [sourceType, globalItems, customTemplateBrowseItems]
  );

  const templateOptions = useMemo(
    () =>
      templates.map((t) => ({
        value: t.id,
        label: templateOptionLabel(t),
      })),
    [templates]
  );

  const fetchTemplates = useCallback(async () => {
    if (sourceType === "STANDALONE") {
      setLoadingTemplates(false);
      return;
    }
    setLoadingTemplates(true);
    setError(null);
    try {
      if (sourceType === "GLOBAL_ITEM") {
        const { getItems } = await import("@/lib/api/items");
        const data = await getItems();
        setGlobalItems(data);
      } else {
        const { fetchGameCustomItemsForBrowse } = await import(
          "@/lib/api/customItems"
        );
        if (customTemplateGameIds.length === 0) {
          setCustomTemplateBrowseItems([]);
        } else {
          const lists = await Promise.all(
            customTemplateGameIds.map((gid) =>
              fetchGameCustomItemsForBrowse(gid)
            )
          );
          const byId = new Map<string, ItemBrowseDetailFields>();
          for (const data of lists) {
            for (const c of data) {
              if (!byId.has(c.id)) {
                byId.set(c.id, c);
              }
            }
          }
          setCustomTemplateBrowseItems(Array.from(byId.values()));
        }
      }
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to load templates"));
    } finally {
      setLoadingTemplates(false);
    }
  }, [customTemplateGameIds, sourceType]);

  const getTemplateBrowseDetail = useCallback(
    (id: string): ItemBrowseDetailFields | null => {
      if (sourceType === "GLOBAL_ITEM") {
        const g = globalItems.find((x) => x.id === id);
        return g ? itemWithIdToBrowseDetail(g) : null;
      }
      if (sourceType === "CUSTOM_ITEM") {
        return customTemplateBrowseItems.find((x) => x.id === id) ?? null;
      }
      return null;
    },
    [sourceType, globalItems, customTemplateBrowseItems]
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate(null);
      void fetchTemplates();
    }
  }, [isOpen, sourceType, fetchTemplates]);

  const toggleAttackRoll = (value: string) => {
    setAttackRollOverride((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const toggleEquipSlot = (value: string) => {
    setEquipSlotTypesOverride((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const toggleDamageType = (value: string) => {
    setDamageTypesOverride((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const buildDamageOverride = (): ItemDamage | undefined => {
    if (
      damageTypesOverride.length === 0 ||
      !damageDiceTypeOverride ||
      !damageNumberOfDiceOverride
    )
      return undefined;
    const diceType = parseInt(damageDiceTypeOverride, 10);
    const numberOfDice = parseInt(damageNumberOfDiceOverride, 10);
    if (
      Number.isNaN(diceType) ||
      Number.isNaN(numberOfDice) ||
      numberOfDice < 1
    )
      return undefined;
    const parsed = itemDamageSchema.safeParse({
      damageType: damageTypesOverride,
      diceType,
      numberOfDice,
    });
    return parsed.success ? parsed.data : undefined;
  };

  const resetOverrides = () => {
    setNameOverride("");
    setDescriptionOverride("");
    setNotesOverride("");
    setUsageOverride("");
    setCostInfoOverride("");
    setConfCostOverride("");
    setWeightOverride("");
    setSpecialTag("");
    setEquippableOverride("");
    setEquipSlotTypesOverride([]);
    setEquipSlotCostOverride("");
    setMaxUsesOverride("");
    setAttackRollOverride([]);
    setAttackMeleeBonusOverride("");
    setAttackRangeBonusOverride("");
    setAttackThrowBonusOverride("");
    setDefenceMeleeBonusOverride("");
    setDefenceRangeBonusOverride("");
    setGridAttackBonusOverride("");
    setGridDefenceBonusOverride("");
    setEffectiveRangeOverride("");
    setMaxRangeOverride("");
    setDamageTypesOverride([]);
    setDamageDiceTypeOverride("");
    setDamageNumberOfDiceOverride("");
    resetImageUpload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (sourceType !== "STANDALONE" && !selectedTemplate) {
      setError("Please select a template item.");
      return;
    }
    if (sourceType === "STANDALONE") {
      const trimmedName = nameOverride.trim();
      if (!trimmedName) {
        setError("Please enter a name for this item.");
        return;
      }
      const w = parseFloat(weightOverride);
      if (weightOverride.trim() === "" || Number.isNaN(w) || w < 0) {
        setError("Please enter a valid weight (0 or greater).");
        return;
      }
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {};
      if (gameIdForSubmit) {
        body.gameId = gameIdForSubmit;
      }

      if (sourceType === "STANDALONE") {
        const w = parseFloat(weightOverride);
        body.sourceType = "STANDALONE";
        body.nameOverride = nameOverride.trim();
        body.weightOverride = w;
      } else {
        body.sourceType = sourceType;
        body.itemId = selectedTemplate!.id;
      }

      const setStr = (key: string, val: string) => {
        if (val.trim()) (body as Record<string, string>)[key] = val.trim();
      };
      const setNum = (key: string, val: string) => {
        if (val === "") return;
        const n = parseFloat(val);
        if (!Number.isNaN(n)) (body as Record<string, number>)[key] = n;
      };
      const setInt = (key: string, val: string) => {
        if (val === "") return;
        const n = parseInt(val, 10);
        if (!Number.isNaN(n)) (body as Record<string, number>)[key] = n;
      };

      if (sourceType !== "STANDALONE") {
        setStr("nameOverride", nameOverride);
      }
      setStr("imageKeyOverride", imageKeyOverride);
      setStr("descriptionOverride", descriptionOverride);
      setStr("notesOverride", notesOverride);
      setStr("usageOverride", usageOverride);
      setStr("costInfoOverride", costInfoOverride);
      setStr("specialTag", specialTag);
      setInt("confCostOverride", confCostOverride);
      if (sourceType !== "STANDALONE") {
        setNum("weightOverride", weightOverride);
      }
      if (equippableOverride !== "") {
        (body as Record<string, boolean>).equippableOverride =
          equippableOverride as boolean;
      }
      if (equipSlotTypesOverride.length > 0) {
        (body as Record<string, string[]>).equipSlotTypesOverride =
          equipSlotTypesOverride;
      }
      if (equipSlotCostOverride !== "") {
        const parsed = equipSlotCostSchema.safeParse(
          parseInt(equipSlotCostOverride, 10)
        );
        if (parsed.success)
          (body as Record<string, number>).equipSlotCostOverride = parsed.data;
      }
      if (maxUsesOverride !== "") {
        const n = parseInt(maxUsesOverride, 10);
        if (Number.isInteger(n) && n > 0)
          (body as Record<string, number>).maxUsesOverride = n;
      }
      if (attackRollOverride.length > 0) {
        (body as Record<string, string[]>).attackRollOverride =
          attackRollOverride;
      }
      const addBonus = (key: string, val: string) => {
        if (val === "") return;
        const n = parseInt(val, 10);
        if (!Number.isNaN(n)) (body as Record<string, number>)[key] = n;
      };
      addBonus("attackMeleeBonusOverride", attackMeleeBonusOverride);
      addBonus("attackRangeBonusOverride", attackRangeBonusOverride);
      addBonus("attackThrowBonusOverride", attackThrowBonusOverride);
      addBonus("defenceMeleeBonusOverride", defenceMeleeBonusOverride);
      addBonus("defenceRangeBonusOverride", defenceRangeBonusOverride);
      addBonus("gridAttackBonusOverride", gridAttackBonusOverride);
      addBonus("gridDefenceBonusOverride", gridDefenceBonusOverride);
      addBonus("effectiveRangeOverride", effectiveRangeOverride);
      addBonus("maxRangeOverride", maxRangeOverride);

      const damage = buildDamageOverride();
      if (damage) body.damageOverride = damage;

      const { createUniqueItem } = await import("@/lib/api/uniqueItems");
      await createUniqueItem(
        body as UniqueItemCreate,
        submitEndpoint ?? "/api/unique-items"
      );
      setPendingImageKey("");
      onSuccess?.();
      void handleClose(true);
    } catch (e) {
      if (pendingImageKey) {
        await deleteUploadedImage(pendingImageKey);
        setPendingImageKey("");
      }
      setError(getUserSafeErrorMessage(e, "Failed to create unique item."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (skipCleanup?: boolean) => {
    if (!skipCleanup && pendingImageKey) {
      await deleteUploadedImage(pendingImageKey);
    }
    setSelectedTemplate(null);
    setSourceType("GLOBAL_ITEM");
    resetOverrides();
    setError(null);
    onClose();
  };

  const submitDisabled =
    sourceType === "STANDALONE"
      ? !nameOverride.trim() ||
        weightOverride.trim() === "" ||
        Number.isNaN(parseFloat(weightOverride)) ||
        parseFloat(weightOverride) < 0
      : !selectedTemplate;

  return {
    sourceType,
    setSourceType,
    selectedTemplate,
    setSelectedTemplate,
    customTemplateGameIds,
    loadingTemplates,
    templateOptions,
    templates,
    nameOverride,
    setNameOverride,
    descriptionOverride,
    setDescriptionOverride,
    notesOverride,
    setNotesOverride,
    usageOverride,
    setUsageOverride,
    costInfoOverride,
    setCostInfoOverride,
    confCostOverride,
    setConfCostOverride,
    weightOverride,
    setWeightOverride,
    specialTag,
    setSpecialTag,
    equippableOverride,
    setEquippableOverride,
    equipSlotTypesOverride,
    equipSlotCostOverride,
    setEquipSlotCostOverride,
    maxUsesOverride,
    setMaxUsesOverride,
    attackRollOverride,
    attackMeleeBonusOverride,
    setAttackMeleeBonusOverride,
    attackRangeBonusOverride,
    setAttackRangeBonusOverride,
    attackThrowBonusOverride,
    setAttackThrowBonusOverride,
    defenceMeleeBonusOverride,
    setDefenceMeleeBonusOverride,
    defenceRangeBonusOverride,
    setDefenceRangeBonusOverride,
    gridAttackBonusOverride,
    setGridAttackBonusOverride,
    gridDefenceBonusOverride,
    setGridDefenceBonusOverride,
    effectiveRangeOverride,
    setEffectiveRangeOverride,
    maxRangeOverride,
    setMaxRangeOverride,
    damageTypesOverride,
    damageDiceTypeOverride,
    setDamageDiceTypeOverride,
    damageNumberOfDiceOverride,
    setDamageNumberOfDiceOverride,
    toggleAttackRoll,
    toggleEquipSlot,
    toggleDamageType,
    imageUpload,
    imageKeyOverride,
    handleImageFile,
    handleImageDrop,
    handleImageDragOver,
    submitting,
    error,
    handleSubmit,
    handleClose,
    submitDisabled,
    getTemplateBrowseDetail,
  };
}

export type CreateUniqueItemModalModel = ReturnType<
  typeof useCreateUniqueItemModal
>;
