"use client";

import type { ItemWithId } from "@/lib/api/items";
import {
  equipSlotCostSchema,
  itemDamageSchema,
  type ItemDamage,
} from "@/app/lib/types/item";
import { ImageUploadDropzone } from "@/app/components/games/shared/ImageUploadDropzone";
import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { modalInputClass } from "@/app/components/games/shared/modalStyles";
import { useItemImageUpload } from "@/app/components/games/shared/useItemImageUpload";
import {
  getUserSafeApiError,
  getUserSafeErrorMessage,
} from "@/lib/userSafeError";
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

type CreateUniqueItemModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function CreateUniqueItemModal({
  isOpen,
  gameId,
  gameName,
  onClose,
  onSuccess,
}: CreateUniqueItemModalProps) {
  const [sourceType, setSourceType] = useState<"GLOBAL_ITEM" | "CUSTOM_ITEM">(
    "GLOBAL_ITEM"
  );
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(
    null
  );
  const [globalItems, setGlobalItems] = useState<ItemWithId[]>([]);
  const [customItems, setCustomItems] = useState<TemplateItem[]>([]);
  const [templateSearch, setTemplateSearch] = useState("");
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

  const templates = sourceType === "GLOBAL_ITEM" ? globalItems : customItems;
  const filteredTemplates = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.type?.toLowerCase().includes(q)
    );
  }, [templates, templateSearch]);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    setError(null);
    try {
      if (sourceType === "GLOBAL_ITEM") {
        const { getItems } = await import("@/lib/api/items");
        const data = await getItems();
        setGlobalItems(data);
      } else {
        const res = await fetch(
          `/api/games/${encodeURIComponent(gameId)}/custom-items`
        );
        if (!res.ok) throw new Error("Failed to load custom items");
        const data = await res.json();
        setCustomItems(
          Array.isArray(data)
            ? data.map((c: { id: string; name: string; type?: string }) => ({
                id: c.id,
                name: c.name,
                type: c.type,
              }))
            : []
        );
      }
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to load templates"));
    } finally {
      setLoadingTemplates(false);
    }
  }, [gameId, sourceType]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate(null);
      setTemplateSearch("");
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
    if (!selectedTemplate) {
      setError("Please select a template item.");
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        gameId,
        sourceType,
        itemId: selectedTemplate.id,
      };
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

      setStr("nameOverride", nameOverride);
      setStr("imageKeyOverride", imageKeyOverride);
      setStr("descriptionOverride", descriptionOverride);
      setStr("notesOverride", notesOverride);
      setStr("usageOverride", usageOverride);
      setStr("costInfoOverride", costInfoOverride);
      setStr("specialTag", specialTag);
      setInt("confCostOverride", confCostOverride);
      setNum("weightOverride", weightOverride);
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

      const res = await fetch("/api/unique-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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
            "Failed to create unique item."
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
    setTemplateSearch("");
    resetOverrides();
    setError(null);
    onClose();
  };

  return (
    <GameFormModal
      isOpen={isOpen}
      title={`Create unique item — ${gameName}`}
      subtitle="Choose a template (global or game custom item), then optionally set overrides. All override fields are optional."
      titleId="create-unique-item-title"
      error={error}
      onClose={() => void handleClose()}
      onSubmit={(e) => void handleSubmit(e)}
      submitting={submitting}
      submitLabel="Create unique item"
      submittingLabel="Creating…"
      submitDisabled={!selectedTemplate}
    >
      {/* Template selection */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">
          Template (required)
        </h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <label
              className={`cursor-pointer rounded px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
                sourceType === "GLOBAL_ITEM"
                  ? "bg-modalBackground-400 text-white"
                  : "bg-paleBlue text-gray-900"
              }`}
            >
              <input
                type="radio"
                name="sourceType"
                checked={sourceType === "GLOBAL_ITEM"}
                onChange={() => {
                  setSourceType("GLOBAL_ITEM");
                  setSelectedTemplate(null);
                }}
                disabled={submitting}
                className="sr-only"
              />
              Global item
            </label>
            <label
              className={`cursor-pointer rounded px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
                sourceType === "CUSTOM_ITEM"
                  ? "bg-modalBackground-400 text-white"
                  : "bg-paleBlue text-gray-900"
              }`}
            >
              <input
                type="radio"
                name="sourceType"
                checked={sourceType === "CUSTOM_ITEM"}
                onChange={() => {
                  setSourceType("CUSTOM_ITEM");
                  setSelectedTemplate(null);
                }}
                disabled={submitting}
                className="sr-only"
              />
              Custom item (this game)
            </label>
          </div>
          <div>
            <label
              htmlFor="template-search"
              className="mb-1 block text-sm font-medium text-white"
            >
              Search
            </label>
            <input
              id="template-search"
              type="text"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className={modalInputClass}
              placeholder="Filter by name or type"
              disabled={submitting}
            />
          </div>
          {loadingTemplates ? (
            <p className="text-sm text-white/70">Loading templates…</p>
          ) : (
            <div className="max-h-40 overflow-y-auto rounded border border-white/30 bg-white/5 p-2">
              {filteredTemplates.length === 0 ? (
                <p className="text-sm text-white/60">
                  {templates.length === 0
                    ? "No templates available."
                    : "No matching items."}
                </p>
              ) : (
                <ul className="space-y-1">
                  {filteredTemplates.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate(t)}
                        className={`w-full rounded px-2 py-1.5 text-left text-sm transition-colors ${
                          selectedTemplate?.id === t.id
                            ? "bg-white/20 text-white"
                            : "text-white/90 hover:bg-white/10"
                        }`}
                        disabled={submitting}
                      >
                        {t.name}
                        {t.type && (
                          <span className="ml-2 text-white/60">{t.type}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {selectedTemplate && (
            <p className="text-sm text-neblirSafe-400">
              Template: <strong>{selectedTemplate.name}</strong>
            </p>
          )}
        </div>
      </section>

      {/* Overrides */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">
          Overrides (all optional)
        </h3>
        <div className="space-y-3">
          <div>
            <ModalFieldLabel id="unique-name-override" label="Name override" />
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
          <div className="grid grid-cols-2 gap-2">
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
                <label
                  key={t.value}
                  className="flex cursor-pointer items-center gap-1.5 text-sm text-white"
                >
                  <input
                    type="checkbox"
                    checked={attackRollOverride.includes(t.value)}
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
                <label
                  key={d}
                  className="flex cursor-pointer items-center gap-1 text-xs text-white"
                >
                  <input
                    type="checkbox"
                    checked={damageTypesOverride.includes(d)}
                    onChange={() => toggleDamageType(d)}
                    disabled={submitting}
                    className="rounded border-white/50"
                  />
                  {d}
                </label>
              ))}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {DAMAGE_TYPES.slice(6).map((d) => (
                <label
                  key={d}
                  className="flex cursor-pointer items-center gap-1 text-xs text-white"
                >
                  <input
                    type="checkbox"
                    checked={damageTypesOverride.includes(d)}
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
            <div className="flex flex-wrap gap-2">
              <label
                className={`cursor-pointer rounded px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
                  equippableOverride === ""
                    ? "bg-modalBackground-400 text-white"
                    : "bg-paleBlue text-gray-900"
                }`}
              >
                <input
                  type="radio"
                  name="equippableOverride"
                  checked={equippableOverride === ""}
                  onChange={() => setEquippableOverride("")}
                  disabled={submitting}
                  className="sr-only"
                />
                Use template
              </label>
              <label
                className={`cursor-pointer rounded px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
                  equippableOverride === true
                    ? "bg-modalBackground-400 text-white"
                    : "bg-paleBlue text-gray-900"
                }`}
              >
                <input
                  type="radio"
                  name="equippableOverride"
                  checked={equippableOverride === true}
                  onChange={() => setEquippableOverride(true)}
                  disabled={submitting}
                  className="sr-only"
                />
                Yes
              </label>
              <label
                className={`cursor-pointer rounded px-3 py-1.5 text-sm font-medium transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
                  equippableOverride === false
                    ? "bg-modalBackground-400 text-white"
                    : "bg-paleBlue text-gray-900"
                }`}
              >
                <input
                  type="radio"
                  name="equippableOverride"
                  checked={equippableOverride === false}
                  onChange={() => setEquippableOverride(false)}
                  disabled={submitting}
                  className="sr-only"
                />
                No
              </label>
            </div>
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
                    <label
                      key={s.value}
                      className="flex cursor-pointer items-center gap-1.5 text-sm text-white"
                    >
                      <input
                        type="checkbox"
                        checked={equipSlotTypesOverride.includes(s.value)}
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
