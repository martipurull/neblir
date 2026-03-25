"use client";

import type { ItemWithId } from "@/lib/api/items";
import {
  equipSlotCostSchema,
  itemDamageSchema,
  type UniqueItemCreate,
  type ItemDamage,
} from "@/app/lib/types/item";
import { ImageUploadDropzone } from "@/app/components/games/shared/ImageUploadDropzone";
import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { modalInputClass } from "@/app/components/games/shared/modalStyles";
import { useItemImageUpload } from "@/app/components/games/shared/useItemImageUpload";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import React, { useCallback, useEffect, useMemo, useState } from "react";

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

type TemplateItem = { id: string; name: string; type?: string };

function templateOptionLabel(t: TemplateItem) {
  return t.type ? `${t.name} (${t.type})` : t.name;
}

type CreateUniqueItemModalProps = {
  isOpen: boolean;
  /**
   * Games whose custom items are listed when "Game custom item" is selected.
   * Can be empty (only global templates will be available).
   */
  customTemplateGameIds: string[];
  /**
   * If set, included as `gameId` on create (e.g. GM creating in a game).
   * Omit for character flow — the API derives game from the custom template when needed.
   */
  gameIdForSubmit?: string;
  /** Optional; shown after an em dash in the modal title (e.g. game name on GM page). */
  titleSuffix?: string;
  submitEndpoint?: string;
  noLinkedGameNotice?: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function CreateUniqueItemModal({
  isOpen,
  customTemplateGameIds,
  gameIdForSubmit,
  titleSuffix,
  submitEndpoint,
  noLinkedGameNotice,
  onClose,
  onSuccess,
}: CreateUniqueItemModalProps) {
  const [sourceType, setSourceType] = useState<
    "GLOBAL_ITEM" | "CUSTOM_ITEM" | "STANDALONE"
  >("GLOBAL_ITEM");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(
    null
  );
  const [globalItems, setGlobalItems] = useState<ItemWithId[]>([]);
  const [customItems, setCustomItems] = useState<TemplateItem[]>([]);
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

  const templates =
    sourceType === "GLOBAL_ITEM"
      ? globalItems
      : sourceType === "CUSTOM_ITEM"
        ? customItems
        : [];
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
          setCustomItems([]);
        } else {
          const lists = await Promise.all(
            customTemplateGameIds.map((gid) =>
              fetchGameCustomItemsForBrowse(gid)
            )
          );
          const byId = new Map<string, TemplateItem>();
          for (const data of lists) {
            for (const c of data) {
              if (!byId.has(c.id)) {
                byId.set(c.id, { id: c.id, name: c.name, type: c.type });
              }
            }
          }
          setCustomItems(Array.from(byId.values()));
        }
      }
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to load templates"));
    } finally {
      setLoadingTemplates(false);
    }
  }, [customTemplateGameIds, sourceType]);

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
    setDamageTypesOverride([]);
    setDamageDiceTypeOverride("");
    setDamageNumberOfDiceOverride("");
    resetImageUpload();
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

  return (
    <GameFormModal
      isOpen={isOpen}
      title={
        titleSuffix?.trim()
          ? `Create unique item — ${titleSuffix.trim()}`
          : "Create unique item"
      }
      subtitle={
        sourceType === "STANDALONE"
          ? "Enter a name and weight, then add any extra details below — all fields except name and weight are optional."
          : "Choose a template (global catalog or a game’s custom item), then optionally set overrides. All override fields are optional."
      }
      titleId="create-unique-item-title"
      error={error}
      onClose={() => void handleClose()}
      onSubmit={(e) => void handleSubmit(e)}
      submitting={submitting}
      submitLabel="Create unique item"
      submittingLabel="Creating…"
      submitDisabled={
        sourceType === "STANDALONE"
          ? !nameOverride.trim() ||
            weightOverride.trim() === "" ||
            Number.isNaN(parseFloat(weightOverride)) ||
            parseFloat(weightOverride) < 0
          : !selectedTemplate
      }
    >
      {noLinkedGameNotice && (
        <p className="mb-1 text-xs text-white/70">{noLinkedGameNotice}</p>
      )}
      {/* Template or standalone basics */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">
          {sourceType === "STANDALONE"
            ? "Custom item (no template)"
            : "Template (required)"}
        </h3>
        <div className="space-y-3">
          <RadioGroup
            name="sourceType"
            value={sourceType}
            tone="inverse"
            variant="chip"
            options={[
              { value: "GLOBAL_ITEM", label: "Global item" },
              { value: "CUSTOM_ITEM", label: "Game custom item" },
              { value: "STANDALONE", label: "No template" },
            ]}
            onChange={(value) => {
              if (
                value === "CUSTOM_ITEM" &&
                customTemplateGameIds.length === 0
              ) {
                return;
              }
              setSourceType(
                value as "GLOBAL_ITEM" | "CUSTOM_ITEM" | "STANDALONE"
              );
              setSelectedTemplate(null);
            }}
            disabled={submitting}
          />
          {customTemplateGameIds.length === 0 && (
            <p className="text-xs text-white/60">
              No games available for custom templates.
            </p>
          )}

          {sourceType === "STANDALONE" ? (
            <div className="space-y-3 rounded border border-white/20 bg-white/5 p-3">
              <p className="text-sm text-white/80">
                For found objects, gifts, or anything that is not in the
                catalogs — only a name and weight are required.
              </p>
              <div>
                <ModalFieldLabel
                  id="standalone-unique-name"
                  label="Name"
                  required
                />
                <input
                  id="standalone-unique-name"
                  type="text"
                  value={nameOverride}
                  onChange={(e) => setNameOverride(e.target.value)}
                  className={modalInputClass}
                  placeholder='e.g. "Mysterious bracelet"'
                  disabled={submitting}
                />
              </div>
              <div>
                <ModalFieldLabel
                  id="standalone-unique-weight"
                  label="Weight (kg)"
                  required
                />
                <input
                  id="standalone-unique-weight"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={weightOverride}
                  onChange={(e) => setWeightOverride(e.target.value)}
                  className={modalInputClass}
                  placeholder="0"
                  disabled={submitting}
                />
              </div>
            </div>
          ) : (
            <>
              {loadingTemplates ? (
                <p className="text-sm text-white/70">Loading templates…</p>
              ) : (
                <>
                  <SelectDropdown
                    id="unique-item-template"
                    label="Template"
                    placeholder="Select a template…"
                    value={selectedTemplate?.id ?? ""}
                    options={templateOptions}
                    disabled={submitting || templateOptions.length === 0}
                    onChange={(id) => {
                      if (!id) {
                        setSelectedTemplate(null);
                        return;
                      }
                      const t = templates.find((x) => x.id === id);
                      setSelectedTemplate(t ?? null);
                    }}
                  />
                  {templateOptions.length === 0 && (
                    <p className="mt-2 text-sm text-white/60">
                      {sourceType === "CUSTOM_ITEM" &&
                      customTemplateGameIds.length === 0
                        ? "Link this character to a game to use custom item templates, or choose a global item above."
                        : "No templates available."}
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Overrides */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">
          {sourceType === "STANDALONE"
            ? "Extra details (all optional)"
            : "Overrides (all optional)"}
        </h3>
        <div className="space-y-3">
          {sourceType !== "STANDALONE" && (
            <div>
              <ModalFieldLabel
                id="unique-name-override"
                label="Name override"
              />
              <input
                id="unique-name-override"
                type="text"
                value={nameOverride}
                onChange={(e) => setNameOverride(e.target.value)}
                className={modalInputClass}
                placeholder="Override display name"
                disabled={submitting}
              />
            </div>
          )}
          <div>
            <ModalFieldLabel
              id="unique-desc-override"
              label="Description override"
            />
            <textarea
              id="unique-desc-override"
              value={descriptionOverride}
              onChange={(e) => setDescriptionOverride(e.target.value)}
              className={modalInputClass + " min-h-[60px]"}
              placeholder="Override description"
              disabled={submitting}
              rows={2}
            />
          </div>
          <div>
            <ModalFieldLabel
              id="unique-usage-override"
              label="Usage override"
            />
            <input
              id="unique-usage-override"
              type="text"
              value={usageOverride}
              onChange={(e) => setUsageOverride(e.target.value)}
              className={modalInputClass}
              disabled={submitting}
            />
          </div>
          <div>
            <ModalFieldLabel
              id="unique-notes-override"
              label="Notes override"
            />
            <input
              id="unique-notes-override"
              type="text"
              value={notesOverride}
              onChange={(e) => setNotesOverride(e.target.value)}
              className={modalInputClass}
              disabled={submitting}
            />
          </div>
          <div>
            <ModalFieldLabel id="unique-special-tag" label="Special tag" />
            <input
              id="unique-special-tag"
              type="text"
              value={specialTag}
              onChange={(e) => setSpecialTag(e.target.value)}
              className={modalInputClass}
              placeholder="e.g. AMPLIFIED, PROTOTYPE"
              disabled={submitting}
            />
          </div>
          <div
            className={
              sourceType === "STANDALONE"
                ? "grid grid-cols-1 gap-2"
                : "grid grid-cols-2 gap-2"
            }
          >
            {sourceType !== "STANDALONE" && (
              <div>
                <ModalFieldLabel
                  id="unique-weight-override"
                  label="Weight override"
                />
                <input
                  id="unique-weight-override"
                  type="number"
                  min={0}
                  step={0.1}
                  value={weightOverride}
                  onChange={(e) => setWeightOverride(e.target.value)}
                  className={modalInputClass}
                  disabled={submitting}
                />
              </div>
            )}
            <div>
              <ModalFieldLabel
                id="unique-conf-cost-override"
                label="Conf cost override"
              />
              <input
                id="unique-conf-cost-override"
                type="number"
                min={0}
                value={confCostOverride}
                onChange={(e) => setConfCostOverride(e.target.value)}
                className={modalInputClass}
                disabled={submitting}
              />
            </div>
          </div>
          <div>
            <ModalFieldLabel
              id="unique-cost-info-override"
              label="Cost info override"
            />
            <input
              id="unique-cost-info-override"
              type="text"
              value={costInfoOverride}
              onChange={(e) => setCostInfoOverride(e.target.value)}
              className={modalInputClass}
              disabled={submitting}
            />
          </div>

          {/* Combat overrides */}
          <div>
            <ModalFieldLabel
              id="unique-attack-roll-override"
              label="Attack roll override"
            />
            <div className="flex flex-wrap gap-2">
              {ATTACK_ROLL_TYPES.map((t) => (
                <Checkbox
                  key={t.value}
                  checked={attackRollOverride.includes(t.value)}
                  onChange={() => toggleAttackRoll(t.value)}
                  disabled={submitting}
                  tone="inverse"
                  label={t.label}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div>
              <ModalFieldLabel id="unique-melee-override" label="Melee bonus" />
              <input
                id="unique-melee-override"
                type="number"
                value={attackMeleeBonusOverride}
                onChange={(e) => setAttackMeleeBonusOverride(e.target.value)}
                className={modalInputClass}
                disabled={submitting}
              />
            </div>
            <div>
              <ModalFieldLabel id="unique-range-override" label="Range bonus" />
              <input
                id="unique-range-override"
                type="number"
                value={attackRangeBonusOverride}
                onChange={(e) => setAttackRangeBonusOverride(e.target.value)}
                className={modalInputClass}
                disabled={submitting}
              />
            </div>
            <div>
              <ModalFieldLabel id="unique-throw-override" label="Throw bonus" />
              <input
                id="unique-throw-override"
                type="number"
                value={attackThrowBonusOverride}
                onChange={(e) => setAttackThrowBonusOverride(e.target.value)}
                className={modalInputClass}
                disabled={submitting}
              />
            </div>
            <div>
              <ModalFieldLabel
                id="unique-grid-attack-override"
                label="Grid attack"
              />
              <input
                id="unique-grid-attack-override"
                type="number"
                value={gridAttackBonusOverride}
                onChange={(e) => setGridAttackBonusOverride(e.target.value)}
                className={modalInputClass}
                disabled={submitting}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <ModalFieldLabel
                id="unique-def-melee-override"
                label="Defence melee"
              />
              <input
                id="unique-def-melee-override"
                type="number"
                value={defenceMeleeBonusOverride}
                onChange={(e) => setDefenceMeleeBonusOverride(e.target.value)}
                className={modalInputClass}
                disabled={submitting}
              />
            </div>
            <div>
              <ModalFieldLabel
                id="unique-def-range-override"
                label="Defence range"
              />
              <input
                id="unique-def-range-override"
                type="number"
                value={defenceRangeBonusOverride}
                onChange={(e) => setDefenceRangeBonusOverride(e.target.value)}
                className={modalInputClass}
                disabled={submitting}
              />
            </div>
            <div>
              <ModalFieldLabel
                id="unique-grid-def-override"
                label="Grid defence"
              />
              <input
                id="unique-grid-def-override"
                type="number"
                value={gridDefenceBonusOverride}
                onChange={(e) => setGridDefenceBonusOverride(e.target.value)}
                className={modalInputClass}
                disabled={submitting}
              />
            </div>
          </div>
          <div>
            <ModalFieldLabel
              id="unique-damage-types-override"
              label="Damage override — types"
            />
            <div className="flex flex-wrap gap-1.5">
              {DAMAGE_TYPES.slice(0, 6).map((d) => (
                <Checkbox
                  key={d}
                  checked={damageTypesOverride.includes(d)}
                  onChange={() => toggleDamageType(d)}
                  disabled={submitting}
                  tone="inverse"
                  label={d}
                  className="text-xs"
                />
              ))}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {DAMAGE_TYPES.slice(6).map((d) => (
                <Checkbox
                  key={d}
                  checked={damageTypesOverride.includes(d)}
                  onChange={() => toggleDamageType(d)}
                  disabled={submitting}
                  tone="inverse"
                  label={d}
                  className="text-xs"
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <ModalFieldLabel
                id="unique-dice-type-override"
                label="Damage dice type"
              />
              <input
                id="unique-dice-type-override"
                type="number"
                min={1}
                value={damageDiceTypeOverride}
                onChange={(e) => setDamageDiceTypeOverride(e.target.value)}
                className={modalInputClass}
                disabled={submitting}
              />
            </div>
            <div>
              <ModalFieldLabel
                id="unique-number-dice-override"
                label="Number of dice"
              />
              <input
                id="unique-number-dice-override"
                type="number"
                min={1}
                value={damageNumberOfDiceOverride}
                onChange={(e) => setDamageNumberOfDiceOverride(e.target.value)}
                className={modalInputClass}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Equippable overrides */}
          <div>
            <ModalFieldLabel
              id="unique-equippable-override"
              label="Equippable override"
            />
            <RadioGroup
              name="equippableOverride"
              value={
                equippableOverride === ""
                  ? "template"
                  : equippableOverride
                    ? "yes"
                    : "no"
              }
              tone="inverse"
              variant="chip"
              options={[
                { value: "template", label: "Use template" },
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              onChange={(value) => {
                if (value === "template") {
                  setEquippableOverride("");
                } else {
                  setEquippableOverride(value === "yes");
                }
              }}
              disabled={submitting}
            />
          </div>
          {equippableOverride !== "" && (
            <>
              <div>
                <ModalFieldLabel
                  id="unique-equip-slots-override"
                  label="Equip slots override"
                />
                <div className="flex flex-wrap gap-2">
                  {EQUIP_SLOTS.map((s) => (
                    <Checkbox
                      key={s.value}
                      checked={equipSlotTypesOverride.includes(s.value)}
                      onChange={() => toggleEquipSlot(s.value)}
                      disabled={submitting}
                      tone="inverse"
                      label={s.label}
                    />
                  ))}
                </div>
              </div>
              <div>
                <ModalFieldLabel
                  id="unique-equip-slot-cost-override"
                  label="Equip slot cost (0–2)"
                />
                <input
                  id="unique-equip-slot-cost-override"
                  type="number"
                  min={0}
                  max={2}
                  value={equipSlotCostOverride}
                  onChange={(e) => setEquipSlotCostOverride(e.target.value)}
                  className={modalInputClass}
                  disabled={submitting}
                />
              </div>
            </>
          )}
          <div>
            <ModalFieldLabel
              id="unique-max-uses-override"
              label="Max uses override"
            />
            <input
              id="unique-max-uses-override"
              type="number"
              min={1}
              value={maxUsesOverride}
              onChange={(e) => setMaxUsesOverride(e.target.value)}
              className={modalInputClass}
              placeholder="Leave empty to use template"
              disabled={submitting}
            />
          </div>
        </div>
      </section>

      <ImageUploadDropzone
        id="unique-image-override"
        label="Image override"
        imageKey={imageKeyOverride}
        onFileChange={(file) => void handleImageFile(file)}
        onDrop={handleImageDrop}
        onDragOver={handleImageDragOver}
        uploading={imageUpload.uploading}
        error={imageUpload.uploadError}
        disabled={submitting}
      />
    </GameFormModal>
  );
}
