import type { ItemWithId } from "@/lib/api/items";
import {
  itemAttributePathSchema,
  itemGeneralSkillSchema,
} from "@/app/lib/itemModifierEnums";
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
import { useImageUpload } from "@/hooks/use-image-upload";
import {
  getUniqueItemById,
  updateUniqueItem,
  type UniqueItemDetailRecord,
} from "@/lib/api/uniqueItems";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { optionalStoredRichHtml } from "@/app/lib/tiptap/richText";
import {
  clearUniqueItemDraft,
  isMeaningfulUniqueItemDraft,
  persistUniqueItemDraft,
  readUniqueItemDraft,
  type UniqueItemDraft,
  type UniqueItemDraftScope,
} from "@/app/components/games/uniqueItemDraftStorage";
import { useModalDraftSession } from "@/app/components/games/useModalDraftSession";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { templateOptionLabel } from "./uniqueItemModalTypes";

function optionalNumStr(value: number | null | undefined): string {
  return value != null ? String(value) : "";
}

function strField(data: UniqueItemDetailRecord, key: string): string {
  const value = data[key];
  return typeof value === "string" ? value : "";
}

type Args = {
  isOpen: boolean;
  customTemplateGameIds: string[];
  /** When set, create-mode drafts persist in sessionStorage for this scope. */
  draftScope?: UniqueItemDraftScope;
  gameIdForSubmit?: string;
  submitEndpoint?: string;
  editUniqueItemId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

function applyUniqueItemDraft(
  draft: UniqueItemDraft,
  apply: {
    setSourceType: (v: UniqueItemDraft["sourceType"]) => void;
    setNameOverride: (v: string) => void;
    setDescriptionOverride: (v: string) => void;
    setNotesOverride: (v: string) => void;
    setUsageOverride: (v: string) => void;
    setCostInfoOverride: (v: string) => void;
    setConfCostOverride: (v: string) => void;
    setWeightOverride: (v: string) => void;
    setSpecialTag: (v: string) => void;
    setEquippableOverride: (v: boolean | "") => void;
    setEquipSlotTypesOverride: (v: string[]) => void;
    setEquipSlotCostOverride: (v: string) => void;
    setMaxUsesOverride: (v: string) => void;
    setModifiesAttributeOverride: (v: string) => void;
    setAttributeModOverride: (v: string) => void;
    setModifiesSkillOverride: (v: string) => void;
    setSkillModOverride: (v: string) => void;
    setIsSpeedAlteredOverride: (v: boolean | "") => void;
    setIsSpeedAlteredStandalone: (v: boolean) => void;
    setAttackRollOverride: (v: string[]) => void;
    setAttackMeleeBonusOverride: (v: string) => void;
    setAttackRangeBonusOverride: (v: string) => void;
    setAttackThrowBonusOverride: (v: string) => void;
    setDefenceMeleeBonusOverride: (v: string) => void;
    setDefenceRangeBonusOverride: (v: string) => void;
    setGridAttackBonusOverride: (v: string) => void;
    setGridDefenceBonusOverride: (v: string) => void;
    setEffectiveRangeOverride: (v: string) => void;
    setMaxRangeOverride: (v: string) => void;
    setDamageTypesOverride: (v: string[]) => void;
    setDamageDiceTypeOverride: (v: string) => void;
    setDamageNumberOfDiceOverride: (v: string) => void;
    setImageKeyOverride: (v: string) => void;
    setPendingImageKey: (v: string) => void;
    bumpRichTextSyncKey: () => void;
  }
): string | null {
  apply.setSourceType(draft.sourceType);
  apply.setNameOverride(draft.nameOverride);
  apply.setDescriptionOverride(draft.descriptionOverride);
  apply.setNotesOverride(draft.notesOverride);
  apply.setUsageOverride(draft.usageOverride);
  apply.setCostInfoOverride(draft.costInfoOverride);
  apply.setConfCostOverride(draft.confCostOverride);
  apply.setWeightOverride(draft.weightOverride);
  apply.setSpecialTag(draft.specialTag);
  apply.setEquippableOverride(draft.equippableOverride);
  apply.setEquipSlotTypesOverride(draft.equipSlotTypesOverride);
  apply.setEquipSlotCostOverride(draft.equipSlotCostOverride);
  apply.setMaxUsesOverride(draft.maxUsesOverride);
  apply.setModifiesAttributeOverride(draft.modifiesAttributeOverride);
  apply.setAttributeModOverride(draft.attributeModOverride);
  apply.setModifiesSkillOverride(draft.modifiesSkillOverride);
  apply.setSkillModOverride(draft.skillModOverride);
  apply.setIsSpeedAlteredOverride(draft.isSpeedAlteredOverride);
  apply.setIsSpeedAlteredStandalone(draft.isSpeedAlteredStandalone);
  apply.setAttackRollOverride(draft.attackRollOverride);
  apply.setAttackMeleeBonusOverride(draft.attackMeleeBonusOverride);
  apply.setAttackRangeBonusOverride(draft.attackRangeBonusOverride);
  apply.setAttackThrowBonusOverride(draft.attackThrowBonusOverride);
  apply.setDefenceMeleeBonusOverride(draft.defenceMeleeBonusOverride);
  apply.setDefenceRangeBonusOverride(draft.defenceRangeBonusOverride);
  apply.setGridAttackBonusOverride(draft.gridAttackBonusOverride);
  apply.setGridDefenceBonusOverride(draft.gridDefenceBonusOverride);
  apply.setEffectiveRangeOverride(draft.effectiveRangeOverride);
  apply.setMaxRangeOverride(draft.maxRangeOverride);
  apply.setDamageTypesOverride(draft.damageTypesOverride);
  apply.setDamageDiceTypeOverride(draft.damageDiceTypeOverride);
  apply.setDamageNumberOfDiceOverride(draft.damageNumberOfDiceOverride);
  apply.setImageKeyOverride(draft.imageKeyOverride);
  apply.setPendingImageKey(draft.imageKeyOverride);
  apply.bumpRichTextSyncKey();
  return draft.selectedTemplateId;
}

export function useCreateUniqueItemModal({
  isOpen,
  customTemplateGameIds,
  draftScope,
  gameIdForSubmit,
  submitEndpoint,
  editUniqueItemId = null,
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
  const [modifiesAttributeOverride, setModifiesAttributeOverride] =
    useState("");
  const [attributeModOverride, setAttributeModOverride] = useState("");
  const [modifiesSkillOverride, setModifiesSkillOverride] = useState("");
  const [skillModOverride, setSkillModOverride] = useState("");
  const [isSpeedAlteredOverride, setIsSpeedAlteredOverride] = useState<
    boolean | ""
  >("");
  const [isSpeedAlteredStandalone, setIsSpeedAlteredStandalone] =
    useState(false);
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

  const imageUpload = useImageUpload("unique_items");
  const {
    imageKey: imageKeyOverride,
    pendingImageKey,
    setPendingImageKey,
    setImageKey: setImageKeyOverride,
    deleteUploadedImage,
    handleFile: handleImageFile,
    handleDrop: handleImageDrop,
    handleDragOver: handleImageDragOver,
    reset: resetImageUpload,
  } = imageUpload;

  const [richTextSyncKey, setRichTextSyncKey] = useState(0);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editTemplateLabel, setEditTemplateLabel] = useState<string | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingTemplateIdRef = useRef<string | null>(null);
  const isEdit = Boolean(editUniqueItemId);
  const resolvedDraftScope = useMemo((): UniqueItemDraftScope | null => {
    const trimmedId = draftScope?.id.trim();
    if (!draftScope || !trimmedId) return null;
    return { ...draftScope, id: trimmedId };
  }, [draftScope]);

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
        const { fetchGameCustomItemsForBrowse } =
          await import("@/lib/api/customItems");
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

  const resetOverrides = useCallback(() => {
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
    setModifiesAttributeOverride("");
    setAttributeModOverride("");
    setModifiesSkillOverride("");
    setSkillModOverride("");
    setIsSpeedAlteredOverride("");
    setIsSpeedAlteredStandalone(false);
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
    setRichTextSyncKey((k) => k + 1);
  }, [resetImageUpload]);

  const resetDraftForm = useCallback(() => {
    pendingTemplateIdRef.current = null;
    setSelectedTemplate(null);
    setSourceType("GLOBAL_ITEM");
    resetOverrides();
  }, [resetOverrides]);

  const applyDraft = useCallback(
    (draft: UniqueItemDraft) => {
      pendingTemplateIdRef.current = applyUniqueItemDraft(draft, {
        setSourceType,
        setNameOverride,
        setDescriptionOverride,
        setNotesOverride,
        setUsageOverride,
        setCostInfoOverride,
        setConfCostOverride,
        setWeightOverride,
        setSpecialTag,
        setEquippableOverride,
        setEquipSlotTypesOverride,
        setEquipSlotCostOverride,
        setMaxUsesOverride,
        setModifiesAttributeOverride,
        setAttributeModOverride,
        setModifiesSkillOverride,
        setSkillModOverride,
        setIsSpeedAlteredOverride,
        setIsSpeedAlteredStandalone,
        setAttackRollOverride,
        setAttackMeleeBonusOverride,
        setAttackRangeBonusOverride,
        setAttackThrowBonusOverride,
        setDefenceMeleeBonusOverride,
        setDefenceRangeBonusOverride,
        setGridAttackBonusOverride,
        setGridDefenceBonusOverride,
        setEffectiveRangeOverride,
        setMaxRangeOverride,
        setDamageTypesOverride,
        setDamageDiceTypeOverride,
        setDamageNumberOfDiceOverride,
        setImageKeyOverride,
        setPendingImageKey,
        bumpRichTextSyncKey: () => setRichTextSyncKey((k) => k + 1),
      });
    },
    [setImageKeyOverride, setPendingImageKey]
  );

  const draftSnapshot = useMemo((): UniqueItemDraft | null => {
    if (isEdit || !resolvedDraftScope) return null;
    return {
      sourceType,
      selectedTemplateId: selectedTemplate?.id ?? null,
      nameOverride,
      descriptionOverride,
      notesOverride,
      usageOverride,
      costInfoOverride,
      confCostOverride,
      weightOverride,
      specialTag,
      equippableOverride,
      equipSlotTypesOverride,
      equipSlotCostOverride,
      maxUsesOverride,
      modifiesAttributeOverride,
      attributeModOverride,
      modifiesSkillOverride,
      skillModOverride,
      isSpeedAlteredOverride,
      isSpeedAlteredStandalone,
      attackRollOverride,
      attackMeleeBonusOverride,
      attackRangeBonusOverride,
      attackThrowBonusOverride,
      defenceMeleeBonusOverride,
      defenceRangeBonusOverride,
      gridAttackBonusOverride,
      gridDefenceBonusOverride,
      effectiveRangeOverride,
      maxRangeOverride,
      damageTypesOverride,
      damageDiceTypeOverride,
      damageNumberOfDiceOverride,
      imageKeyOverride,
    };
  }, [
    isEdit,
    resolvedDraftScope,
    sourceType,
    selectedTemplate,
    nameOverride,
    descriptionOverride,
    notesOverride,
    usageOverride,
    costInfoOverride,
    confCostOverride,
    weightOverride,
    specialTag,
    equippableOverride,
    equipSlotTypesOverride,
    equipSlotCostOverride,
    maxUsesOverride,
    modifiesAttributeOverride,
    attributeModOverride,
    modifiesSkillOverride,
    skillModOverride,
    isSpeedAlteredOverride,
    isSpeedAlteredStandalone,
    attackRollOverride,
    attackMeleeBonusOverride,
    attackRangeBonusOverride,
    attackThrowBonusOverride,
    defenceMeleeBonusOverride,
    defenceRangeBonusOverride,
    gridAttackBonusOverride,
    gridDefenceBonusOverride,
    effectiveRangeOverride,
    maxRangeOverride,
    damageTypesOverride,
    damageDiceTypeOverride,
    damageNumberOfDiceOverride,
    imageKeyOverride,
  ]);

  const draftSession = useModalDraftSession({
    enabled: Boolean(resolvedDraftScope) && !isEdit,
    isOpen,
    snapshot: draftSnapshot,
    isMeaningful: isMeaningfulUniqueItemDraft,
    readDraft: useCallback(() => {
      if (!resolvedDraftScope) return null;
      return readUniqueItemDraft(resolvedDraftScope);
    }, [resolvedDraftScope]),
    persistDraft: useCallback(
      (draft: UniqueItemDraft) => {
        if (!resolvedDraftScope) return;
        persistUniqueItemDraft(resolvedDraftScope, draft);
      },
      [resolvedDraftScope]
    ),
    clearDraft: useCallback(() => {
      if (!resolvedDraftScope) return;
      clearUniqueItemDraft(resolvedDraftScope);
    }, [resolvedDraftScope]),
    applyDraft,
    resetForm: resetDraftForm,
    deletePendingImage: useCallback(async () => {
      if (pendingImageKey) {
        await deleteUploadedImage(pendingImageKey);
      }
    }, [pendingImageKey, deleteUploadedImage]),
    onClose,
  });

  useEffect(() => {
    if (!isOpen || isEdit) return;
    void fetchTemplates();
  }, [isOpen, isEdit, sourceType, fetchTemplates]);

  useEffect(() => {
    if (!isOpen || isEdit || sourceType === "STANDALONE") return;
    const templateId = pendingTemplateIdRef.current;
    if (!templateId) return;
    const detail = getTemplateBrowseDetail(templateId);
    if (detail) {
      setSelectedTemplate(detail);
      pendingTemplateIdRef.current = null;
    }
  }, [
    isOpen,
    isEdit,
    sourceType,
    globalItems,
    customTemplateBrowseItems,
    getTemplateBrowseDetail,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    if (!editUniqueItemId) {
      setEditTemplateLabel(null);
      return;
    }
    let cancelled = false;
    setLoadingEdit(true);
    setError(null);
    resetOverrides();
    void (async () => {
      try {
        const data = await getUniqueItemById(editUniqueItemId);
        if (cancelled) return;
        const loadedSourceType = data.sourceType;
        setSourceType(loadedSourceType);
        if (loadedSourceType === "STANDALONE") {
          setEditTemplateLabel("No template (standalone item)");
          setSelectedTemplate(null);
        } else {
          const template = data.templateItem;
          const templateName =
            template && typeof template.name === "string"
              ? template.name
              : "Template";
          setEditTemplateLabel(templateName);
          if (data.itemId && template) {
            const browse =
              loadedSourceType === "GLOBAL_ITEM"
                ? itemWithIdToBrowseDetail(template as ItemWithId)
                : (template as ItemBrowseDetailFields);
            setSelectedTemplate(browse);
          }
        }
        setNameOverride(strField(data, "nameOverride"));
        setDescriptionOverride(strField(data, "descriptionOverride"));
        setNotesOverride(strField(data, "notesOverride"));
        setUsageOverride(strField(data, "usageOverride"));
        setCostInfoOverride(strField(data, "costInfoOverride"));
        setConfCostOverride(
          optionalNumStr(data.confCostOverride as number | null | undefined)
        );
        setWeightOverride(
          optionalNumStr(data.weightOverride as number | null | undefined)
        );
        setSpecialTag(strField(data, "specialTag"));
        const equippable = data.equippableOverride;
        setEquippableOverride(
          equippable === null || equippable === undefined
            ? ""
            : (equippable as boolean)
        );
        setEquipSlotTypesOverride(
          Array.isArray(data.equipSlotTypesOverride)
            ? (data.equipSlotTypesOverride as string[])
            : []
        );
        setEquipSlotCostOverride(
          optionalNumStr(
            data.equipSlotCostOverride as number | null | undefined
          )
        );
        setMaxUsesOverride(
          optionalNumStr(data.maxUsesOverride as number | null | undefined)
        );
        setModifiesAttributeOverride(
          strField(data, "modifiesAttributeOverride")
        );
        setAttributeModOverride(
          optionalNumStr(data.attributeModOverride as number | null | undefined)
        );
        setModifiesSkillOverride(strField(data, "modifiesSkillOverride"));
        setSkillModOverride(
          optionalNumStr(data.skillModOverride as number | null | undefined)
        );
        const speedOverride = data.isSpeedAlteredOverride;
        if (loadedSourceType === "STANDALONE") {
          setIsSpeedAlteredStandalone(speedOverride === true);
          setIsSpeedAlteredOverride("");
        } else {
          setIsSpeedAlteredOverride(
            speedOverride === null || speedOverride === undefined
              ? ""
              : (speedOverride as boolean)
          );
          setIsSpeedAlteredStandalone(false);
        }
        setAttackRollOverride(
          Array.isArray(data.attackRollOverride)
            ? (data.attackRollOverride as string[])
            : []
        );
        setAttackMeleeBonusOverride(
          optionalNumStr(
            data.attackMeleeBonusOverride as number | null | undefined
          )
        );
        setAttackRangeBonusOverride(
          optionalNumStr(
            data.attackRangeBonusOverride as number | null | undefined
          )
        );
        setAttackThrowBonusOverride(
          optionalNumStr(
            data.attackThrowBonusOverride as number | null | undefined
          )
        );
        setDefenceMeleeBonusOverride(
          optionalNumStr(
            data.defenceMeleeBonusOverride as number | null | undefined
          )
        );
        setDefenceRangeBonusOverride(
          optionalNumStr(
            data.defenceRangeBonusOverride as number | null | undefined
          )
        );
        setGridAttackBonusOverride(
          optionalNumStr(
            data.gridAttackBonusOverride as number | null | undefined
          )
        );
        setGridDefenceBonusOverride(
          optionalNumStr(
            data.gridDefenceBonusOverride as number | null | undefined
          )
        );
        setEffectiveRangeOverride(
          optionalNumStr(
            data.effectiveRangeOverride as number | null | undefined
          )
        );
        setMaxRangeOverride(
          optionalNumStr(data.maxRangeOverride as number | null | undefined)
        );
        const damage = data.damageOverride as ItemDamage | null | undefined;
        if (damage) {
          setDamageTypesOverride(damage.damageType ?? []);
          setDamageDiceTypeOverride(String(damage.diceType));
          setDamageNumberOfDiceOverride(String(damage.numberOfDice));
        }
        setImageKeyOverride(strField(data, "imageKeyOverride"));
        setRichTextSyncKey((k) => k + 1);
      } catch (e) {
        if (!cancelled) {
          setError(getUserSafeErrorMessage(e, "Failed to load unique item."));
        }
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, editUniqueItemId, resetOverrides, setImageKeyOverride]);

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
    if (maxUsesOverride !== "") {
      const n = parseInt(maxUsesOverride, 10);
      if (!Number.isInteger(n) || n <= 0) {
        setError(
          sourceType === "STANDALONE"
            ? "Max uses must be a positive integer or left blank for unlimited."
            : "Max uses override must be a positive integer or left blank to use the template."
        );
        return;
      }
    }
    if (modifiesAttributeOverride.trim()) {
      const parsedPath = itemAttributePathSchema.safeParse(
        modifiesAttributeOverride.trim()
      );
      if (!parsedPath.success) {
        setError("Invalid attribute path for item modifier override.");
        return;
      }
    }
    if (modifiesSkillOverride.trim()) {
      const parsedSkill = itemGeneralSkillSchema.safeParse(
        modifiesSkillOverride.trim()
      );
      if (!parsedSkill.success) {
        setError("Invalid skill for item modifier override.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {};
      if (!isEdit && gameIdForSubmit) {
        body.gameId = gameIdForSubmit;
      }

      if (!isEdit) {
        if (sourceType === "STANDALONE") {
          const w = parseFloat(weightOverride);
          body.sourceType = "STANDALONE";
          body.nameOverride = nameOverride.trim();
          body.weightOverride = w;
        } else {
          body.sourceType = sourceType;
          body.itemId = selectedTemplate!.id;
        }
      } else if (sourceType === "STANDALONE") {
        const w = parseFloat(weightOverride);
        body.nameOverride = nameOverride.trim();
        body.weightOverride = w;
      }

      const setStr = (key: string, val: string) => {
        if (val.trim()) (body as Record<string, string>)[key] = val.trim();
      };
      const setRichStr = (key: string, val: string) => {
        const persisted = optionalStoredRichHtml(val);
        if (persisted) (body as Record<string, string>)[key] = persisted;
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

      if (sourceType !== "STANDALONE" || isEdit) {
        setStr("nameOverride", nameOverride);
      }
      setStr("imageKeyOverride", imageKeyOverride);
      setRichStr("descriptionOverride", descriptionOverride);
      setRichStr("notesOverride", notesOverride);
      setRichStr("usageOverride", usageOverride);
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
        (body as Record<string, number>).maxUsesOverride = parseInt(
          maxUsesOverride,
          10
        );
      }
      if (modifiesAttributeOverride.trim()) {
        (body as Record<string, string>).modifiesAttributeOverride =
          itemAttributePathSchema.parse(modifiesAttributeOverride.trim());
      }
      if (attributeModOverride !== "") {
        const n = parseInt(attributeModOverride, 10);
        if (!Number.isNaN(n))
          (body as Record<string, number>).attributeModOverride = n;
      }
      if (modifiesSkillOverride.trim()) {
        (body as Record<string, string>).modifiesSkillOverride =
          itemGeneralSkillSchema.parse(modifiesSkillOverride.trim());
      }
      if (skillModOverride !== "") {
        const n = parseInt(skillModOverride, 10);
        if (!Number.isNaN(n))
          (body as Record<string, number>).skillModOverride = n;
      }
      if (sourceType === "STANDALONE") {
        (body as Record<string, boolean>).isSpeedAlteredOverride =
          isSpeedAlteredStandalone;
      } else if (isSpeedAlteredOverride !== "") {
        (body as Record<string, boolean>).isSpeedAlteredOverride =
          isSpeedAlteredOverride as boolean;
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

      if (isEdit && editUniqueItemId) {
        await updateUniqueItem(editUniqueItemId, body);
      } else {
        const { createUniqueItem } = await import("@/lib/api/uniqueItems");
        await createUniqueItem(
          body as UniqueItemCreate,
          submitEndpoint ?? "/api/unique-items"
        );
      }
      setPendingImageKey("");
      if (resolvedDraftScope) {
        draftSession.clearDraftOnSuccess();
      }
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
            ? "Failed to update unique item."
            : "Failed to create unique item."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (skipCleanup?: boolean) => {
    await draftSession.handleDismiss(skipCleanup);
    setError(null);
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
    modifiesAttributeOverride,
    setModifiesAttributeOverride,
    attributeModOverride,
    setAttributeModOverride,
    modifiesSkillOverride,
    setModifiesSkillOverride,
    skillModOverride,
    setSkillModOverride,
    isSpeedAlteredOverride,
    setIsSpeedAlteredOverride,
    isSpeedAlteredStandalone,
    setIsSpeedAlteredStandalone,
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
    submitting: submitting || loadingEdit,
    loadingEdit,
    isEdit,
    editTemplateLabel,
    error,
    handleSubmit,
    handleClose,
    submitDisabled,
    getTemplateBrowseDetail,
    richTextSyncKey,
    draftRestored: draftSession.draftRestored,
    draftPersistenceEnabled: draftSession.draftPersistenceEnabled,
    hasDiscardableDraft: draftSession.hasDiscardableDraft,
    discardAndClose: draftSession.discardAndClose,
  };
}

export type CreateUniqueItemModalModel = ReturnType<
  typeof useCreateUniqueItemModal
>;
