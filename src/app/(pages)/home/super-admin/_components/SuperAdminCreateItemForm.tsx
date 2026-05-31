"use client";

import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { RichTextField } from "@/app/components/shared/RichTextField";
import {
  ATTRIBUTE_OPTIONS,
  GENERAL_SKILL_OPTIONS,
} from "@/app/(pages)/home/characters/[id]/level-up/constants";
import { EQUIP_SLOTS } from "@/app/lib/constants/itemCatalogue";
import {
  itemAttributePathSchema,
  itemGeneralSkillSchema,
} from "@/app/lib/itemModifierEnums";
import type {
  weaponAttackRollTypeSchema,
  EquipSlotType,
  Item,
  ItemDamage,
} from "@/app/lib/types/item";
import {
  equipSlotCostSchema,
  itemDamageSchema,
  itemSchema,
  itemUpdateSchema,
} from "@/app/lib/types/item";
import { serializeEditorToStoredHtml } from "@/app/lib/tiptap/richText";
import type { z } from "zod";
import Link from "next/link";
import { NumberInput } from "@/app/components/shared/NumberInput";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import {
  parseCreatedCatalogueId,
  superAdminCatalogueCreatedHref,
} from "../_utils/superAdminCatalogueCreated";
import { superAdminRichEditorScrollClass } from "../_utils/superAdminRichTextEditor";
import { SuperAdminCatalogueImageBlock } from "./SuperAdminCatalogueImageBlock";
import { SuperAdminCatalogueImagePreview } from "./SuperAdminCatalogueImagePreview";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";
import { SuperAdminWeaponFieldsSection } from "./SuperAdminWeaponFieldsSection";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import { superAdminNavLinkClassName } from "./superAdminNavLinkClass";
import {
  catalogueItemImageKey,
  catalogueItemToFormValues,
  type SuperAdminItemFormValues,
} from "../_utils/superAdminItemFormValues";

type ItemTypeChoice = "GENERAL_ITEM" | "WEAPON";

type ItemWeaponAttackRollChoice = z.infer<typeof weaponAttackRollTypeSchema>;

type ItemFormValues = SuperAdminItemFormValues;

const accessOptions = [
  { value: "PLAYER", label: "Player" },
  { value: "GAME_MASTER", label: "Game master" },
];

const itemTypeOptions = [
  { value: "GENERAL_ITEM", label: "General item" },
  { value: "WEAPON", label: "Weapon" },
];

const noneSelectOption = { value: "", label: "None" };

const attributePathOptions = [noneSelectOption, ...ATTRIBUTE_OPTIONS];

const generalSkillOptions = [noneSelectOption, ...GENERAL_SKILL_OPTIONS];

const equipSlotCostOptions = [
  { value: "", label: "Not set" },
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
];

/** Rich-text HTML → optional API field (omit when visually empty). */
function optionalRichHtml(html: string): string | undefined {
  const t = html.trim();
  if (!t) return undefined;
  const persisted = serializeEditorToStoredHtml(t);
  return persisted || undefined;
}

function normalizeAttackRolls(
  v: ItemFormValues["attackRoll"]
): ItemWeaponAttackRollChoice[] {
  if (Array.isArray(v)) {
    return [...new Set(v)] as ItemWeaponAttackRollChoice[];
  }
  if (typeof v === "string" && v) {
    return [v as ItemWeaponAttackRollChoice];
  }
  return ["MELEE"];
}

function buildWeaponDamage(values: ItemFormValues): ItemDamage | null {
  if (values.damageTypes.length === 0) return null;
  const diceType = values.damageDiceType;
  const numberOfDice = values.damageNumberOfDice;
  const parsed = itemDamageSchema.safeParse({
    damageType: values.damageTypes,
    diceType,
    numberOfDice,
  });
  return parsed.success ? parsed.data : null;
}

function buildWeaponNumericExtras(
  rolls: ItemWeaponAttackRollChoice[],
  values: ItemFormValues
): Record<string, number> {
  const out: Record<string, number> = {};
  const put = (key: string, n: number | undefined) => {
    if (n !== undefined) out[key] = n;
  };
  if (rolls.includes("MELEE")) {
    put("attackMeleeBonus", values.attackMeleeBonus);
    put("defenceMeleeBonus", values.defenceMeleeBonus);
  }
  if (rolls.includes("RANGE")) {
    put("attackRangeBonus", values.attackRangeBonus);
    put("defenceRangeBonus", values.defenceRangeBonus);
    put("effectiveRange", values.effectiveRange);
    put("maxRange", values.maxRange);
  }
  if (rolls.includes("THROW")) {
    put("attackThrowBonus", values.attackThrowBonus);
  }
  if (rolls.includes("GRID")) {
    put("gridAttackBonus", values.gridAttackBonus);
    put("gridDefenceBonus", values.gridDefenceBonus);
  }
  return out;
}

async function itemByIdFetcher(url: string): Promise<Item & { id: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as Item & { id: string };
}

export function SuperAdminCreateItemForm({
  editItemId,
}: {
  editItemId?: string;
} = {}) {
  const router = useRouter();
  const isEdit = Boolean(editItemId?.trim());
  const imageKeyRef = useRef("");
  const [previewImageKey, setPreviewImageKey] = useState("");
  const onImageKey = useCallback((key: string) => {
    imageKeyRef.current = key;
    setPreviewImageKey(key);
  }, []);

  const [status, setStatus] = useState<{
    tone: "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    data: existingItem,
    error: loadError,
    isLoading: loadLoading,
  } = useSWR<Item & { id: string }>(
    isEdit && editItemId ? `/api/items/${editItemId}` : null,
    itemByIdFetcher
  );

  const form = useForm<ItemFormValues>({
    defaultValues: {
      itemType: "GENERAL_ITEM",
      accessType: "PLAYER",
      name: "",
      description: "",
      confCost: 0,
      costInfo: "",
      weight: 0,
      usage: "",
      notes: "",
      attackRoll: ["MELEE"],
      damageTypes: ["BULLET"],
      damageDiceType: 6,
      damageNumberOfDice: 1,
      equippable: false,
      equipSlotTypes: [],
      equipSlotCost: "",
      modifiesAttribute: "",
      modifiesSkill: "",
      isSpeedAltered: false,
    },
  });

  useEffect(() => {
    if (!existingItem) return;
    const key = catalogueItemImageKey(existingItem);
    imageKeyRef.current = key;
    setPreviewImageKey(key);
    form.reset(catalogueItemToFormValues(existingItem));
  }, [existingItem, form]);

  const watchedName = useWatch({ control: form.control, name: "name" });
  const editTitleAside = useMemo(() => {
    if (!isEdit || !previewImageKey) return undefined;
    const alt =
      (typeof watchedName === "string" && watchedName.trim()) ||
      (existingItem?.name ?? "Item");
    return (
      <SuperAdminCatalogueImagePreview imageKey={previewImageKey} alt={alt} />
    );
  }, [isEdit, previewImageKey, existingItem?.name, watchedName]);

  const itemType = useWatch({ control: form.control, name: "itemType" });
  const equippable = useWatch({ control: form.control, name: "equippable" });

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus(null);
    const confCost = values.confCost;
    const weight = values.weight;

    const descriptionHtml = values.description.trim();
    if (!serializeEditorToStoredHtml(descriptionHtml)) {
      setStatus({
        tone: "error",
        text: "Description is required.",
      });
      return;
    }

    const usageHtml = values.usage.trim();
    if (values.itemType === "GENERAL_ITEM") {
      if (!serializeEditorToStoredHtml(usageHtml)) {
        setStatus({
          tone: "error",
          text: "Usage is required for general items.",
        });
        return;
      }
    }

    if (values.equippable && values.equipSlotTypes.length === 0) {
      setStatus({
        tone: "error",
        text: "Select at least one equip slot when the item is equippable.",
      });
      return;
    }

    const attrPathTrim = values.modifiesAttribute.trim();
    if (values.attributeMod !== undefined && !attrPathTrim) {
      setStatus({
        tone: "error",
        text: "Select an attribute to modify before setting attribute mod.",
      });
      return;
    }

    const skillPathTrim = values.modifiesSkill.trim();
    if (values.skillMod !== undefined && !skillPathTrim) {
      setStatus({
        tone: "error",
        text: "Select a skill to modify before setting skill mod.",
      });
      return;
    }

    let equipSlotCostParsed: z.infer<typeof equipSlotCostSchema> | undefined;
    if (values.equippable && values.equipSlotCost.trim() !== "") {
      const raw = Number.parseInt(values.equipSlotCost, 10);
      const parsedCost = equipSlotCostSchema.safeParse(raw);
      if (!parsedCost.success) {
        setStatus({
          tone: "error",
          text: "Equip slot cost must be 0, 1, or 2.",
        });
        return;
      }
      equipSlotCostParsed = parsedCost.data;
    }

    let maxUsesNum: number | undefined;
    if (values.maxUses !== undefined) {
      if (!Number.isInteger(values.maxUses) || values.maxUses <= 0) {
        setStatus({
          tone: "error",
          text: "Max uses must be a positive integer or left blank for unlimited.",
        });
        return;
      }
      maxUsesNum = values.maxUses;
    }

    let modifiesAttributeParsed:
      | z.infer<typeof itemAttributePathSchema>
      | undefined;
    if (attrPathTrim) {
      const parsedPath = itemAttributePathSchema.safeParse(attrPathTrim);
      if (!parsedPath.success) {
        setStatus({
          tone: "error",
          text: "Invalid attribute path for item modifier.",
        });
        return;
      }
      modifiesAttributeParsed = parsedPath.data;
    }

    const attributeMod = values.attributeMod;

    let modifiesSkillParsed: z.infer<typeof itemGeneralSkillSchema> | undefined;
    if (skillPathTrim) {
      const parsedSkill = itemGeneralSkillSchema.safeParse(skillPathTrim);
      if (!parsedSkill.success) {
        setStatus({
          tone: "error",
          text: "Invalid skill for item modifier.",
        });
        return;
      }
      modifiesSkillParsed = parsedSkill.data;
    }

    const skillMod = values.skillMod;

    const common = {
      accessType: values.accessType,
      name: values.name.trim(),
      imageKey: imageKeyRef.current.trim() || undefined,
      confCost,
      costInfo: values.costInfo.trim() || undefined,
      description: descriptionHtml,
      notes: optionalRichHtml(values.notes),
      weight,
      equippable: values.equippable,
      equipSlotTypes: values.equippable ? values.equipSlotTypes : [],
      ...(values.equippable && equipSlotCostParsed !== undefined
        ? { equipSlotCost: equipSlotCostParsed }
        : {}),
      ...(maxUsesNum !== undefined ? { maxUses: maxUsesNum } : {}),
      ...(modifiesAttributeParsed !== undefined
        ? { modifiesAttribute: modifiesAttributeParsed }
        : {}),
      ...(attributeMod !== undefined ? { attributeMod } : {}),
      ...(modifiesSkillParsed !== undefined
        ? { modifiesSkill: modifiesSkillParsed }
        : {}),
      ...(skillMod !== undefined ? { skillMod } : {}),
      isSpeedAltered: values.isSpeedAltered,
    };

    let body: Item;
    if (values.itemType === "GENERAL_ITEM") {
      body = {
        type: "GENERAL_ITEM",
        ...common,
        usage: usageHtml,
      };
    } else {
      const attackRolls = normalizeAttackRolls(values.attackRoll);
      if (attackRolls.length === 0) {
        setStatus({
          tone: "error",
          text: "Select at least one attack roll type for a weapon.",
        });
        return;
      }
      const damage = buildWeaponDamage(values);
      if (!damage) {
        setStatus({
          tone: "error",
          text: "Weapon requires at least one damage type and valid dice (faces and count must be integers ≥ 1).",
        });
        return;
      }
      body = {
        type: "WEAPON",
        ...common,
        usage: optionalRichHtml(values.usage),
        attackRoll: attackRolls,
        damage,
        ...buildWeaponNumericExtras(attackRolls, values),
      };
    }

    const parsed = (isEdit ? itemUpdateSchema : itemSchema).safeParse(body);
    if (!parsed.success) {
      setStatus({
        tone: "error",
        text: parsed.error.issues.map((i) => i.message).join(". "),
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/items/${editItemId}` : "/api/items",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        }
      );
      const resBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({
          tone: "error",
          text:
            typeof resBody?.message === "string"
              ? resBody.message
              : `Request failed (${res.status})`,
        });
        return;
      }
      if (isEdit) {
        router.push("/home/super-admin/items/browse");
        return;
      }
      const createdId = parseCreatedCatalogueId(resBody);
      if (!createdId) {
        setStatus({
          tone: "error",
          text: "Item was created but the response did not include an id.",
        });
        return;
      }
      router.push(superAdminCatalogueCreatedHref("item", createdId));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SuperAdminSectionShell
      title={
        isEdit
          ? existingItem
            ? `Edit item — ${existingItem.name}`
            : "Edit official item"
          : "Create official item"
      }
      titleAside={editTitleAside}
      description="Description, usage, and notes use the same TipTap editor as character backstory (rich text stored as HTML). General items require usage. Weapons support multiple attack modes, conditional bonuses/ranges, and configurable damage dice."
    >
      <SuperAdminCatalogueDomainNav
        domain="items"
        active={isEdit ? "browse" : "create"}
      />

      {isEdit && loadLoading ? (
        <InfoCard className="mb-6">
          <LoadingState text="Loading item…" />
        </InfoCard>
      ) : null}

      {isEdit && loadError ? (
        <InfoCard className="mb-6">
          <ErrorState
            message={
              loadError instanceof Error ? loadError.message : "Load failed"
            }
          />
        </InfoCard>
      ) : null}

      <FormProvider {...form}>
        <form
          noValidate
          onSubmit={(e) => void onSubmit(e)}
          className="mt-4"
          hidden={
            isEdit && (loadLoading || Boolean(loadError) || !existingItem)
          }
        >
          <div className="mb-6">
            <SelectDropdown
              id="item-type"
              label="Item type"
              placeholder="Type"
              value={form.watch("itemType")}
              options={itemTypeOptions}
              onChange={(v) => {
                const next = v as ItemTypeChoice;
                form.setValue("itemType", next, { shouldValidate: true });
                if (next === "WEAPON") {
                  const rolls = form.getValues("attackRoll");
                  if (!Array.isArray(rolls) || rolls.length === 0) {
                    form.setValue("attackRoll", ["MELEE"], {
                      shouldValidate: true,
                    });
                  }
                }
              }}
            />
          </div>
          <div className="mb-6">
            <SelectDropdown
              id="item-access"
              label="Access"
              placeholder="Access"
              value={form.watch("accessType")}
              options={accessOptions}
              onChange={(v) =>
                form.setValue("accessType", v as "PLAYER" | "GAME_MASTER", {
                  shouldValidate: true,
                })
              }
            />
          </div>

          <SuperAdminLabeledField
            id="item-name"
            label="Name"
            register={form.register}
            name="name"
          />

          <SuperAdminCatalogueImageBlock
            key={previewImageKey || "new-item-image"}
            uploadType="items"
            id="official-item-image"
            label="Item image (optional)"
            disabled={submitting}
            initialImageKey={previewImageKey}
            onImageKey={onImageKey}
          />

          <div className="mb-6">
            <label
              htmlFor="item-description"
              className="mb-1 block font-bold text-black"
            >
              Description
            </label>
            <p className="mb-2 text-xs text-black/70">
              Rich text is stored as HTML (same editor as character backstory).
            </p>
            <Controller
              name="description"
              control={form.control}
              defaultValue=""
              render={({ field }) => (
                <RichTextField
                  id="item-description"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  minHeightClass="min-h-28"
                  editorContentClassName={superAdminRichEditorScrollClass}
                />
              )}
            />
          </div>

          <NumberInput
            name="confCost"
            label="Conf cost"
            parseAs="int"
            min={0}
          />
          <SuperAdminLabeledField
            id="item-cost-info"
            label="Cost info (optional)"
            register={form.register}
            name="costInfo"
          />
          <NumberInput
            name="weight"
            label="Weight"
            parseAs="float"
            min={0}
            step="any"
          />

          <div className="mb-6">
            <label
              htmlFor="item-usage"
              className="mb-1 block font-bold text-black"
            >
              {itemType === "WEAPON" ? "Usage (optional)" : "Usage"}
            </label>
            <p className="mb-2 text-xs text-black/70">
              {itemType === "WEAPON"
                ? "Optional rich text; omit if the weapon has no extra usage rules."
                : "Required for general items."}
            </p>
            <Controller
              name="usage"
              control={form.control}
              defaultValue=""
              render={({ field }) => (
                <RichTextField
                  id="item-usage"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  minHeightClass="min-h-24"
                  editorContentClassName={superAdminRichEditorScrollClass}
                />
              )}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="item-notes"
              className="mb-1 block font-bold text-black"
            >
              Notes (optional)
            </label>
            <Controller
              name="notes"
              control={form.control}
              defaultValue=""
              render={({ field }) => (
                <RichTextField
                  id="item-notes"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  minHeightClass="min-h-24"
                  editorContentClassName={superAdminRichEditorScrollClass}
                />
              )}
            />
          </div>

          {itemType === "WEAPON" ? (
            <SuperAdminWeaponFieldsSection
              control={form.control}
              setValue={form.setValue}
              getValues={form.getValues}
              disabled={submitting}
            />
          ) : null}

          <div className="mb-6">
            <Controller
              name="equippable"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    if (!v) {
                      form.setValue("equipSlotTypes", []);
                      form.setValue("equipSlotCost", "");
                    }
                  }}
                  label="Equippable"
                />
              )}
            />
          </div>

          {equippable ? (
            <div className="mb-6 rounded-md border border-black/15 bg-paleBlue/25 p-4">
              <h2 className="mb-3 text-sm font-bold text-black">Equipment</h2>
              <div className="mb-4">
                <p className="mb-2 text-sm font-bold text-black">Equip slots</p>
                <div className="flex flex-wrap gap-3">
                  {EQUIP_SLOTS.map((s) => {
                    const slot = s.value as EquipSlotType;
                    const selected = form
                      .watch("equipSlotTypes")
                      .includes(slot);
                    return (
                      <Checkbox
                        key={s.value}
                        checked={selected}
                        onChange={(checked) => {
                          const cur = form.getValues("equipSlotTypes");
                          if (checked) {
                            if (!cur.includes(slot)) {
                              form.setValue("equipSlotTypes", [...cur, slot], {
                                shouldValidate: true,
                              });
                            }
                          } else {
                            form.setValue(
                              "equipSlotTypes",
                              cur.filter((x) => x !== slot),
                              { shouldValidate: true }
                            );
                          }
                        }}
                        label={s.label}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="mb-0">
                <SelectDropdown
                  id="item-equip-slot-cost"
                  label="Equip slot cost"
                  placeholder="Cost"
                  value={form.watch("equipSlotCost")}
                  options={equipSlotCostOptions}
                  pinValueFirst=""
                  onChange={(v) =>
                    form.setValue("equipSlotCost", v, { shouldValidate: true })
                  }
                />
                <p className="mt-1 text-xs text-black/65">
                  Slot cost in units of 0, 1, or 2. Leave “Not set” if the item
                  does not define a cost.
                </p>
              </div>
            </div>
          ) : null}

          <div className="mb-6 rounded-md border border-black/15 bg-paleBlue/25 p-4">
            <h2 className="mb-3 text-sm font-bold text-black">
              Uses &amp; stat modifiers
            </h2>
            <NumberInput
              name="maxUses"
              label="Max uses (optional)"
              min={1}
              allowEmpty
              placeholder="Unlimited if blank"
            />
            <p className="-mt-3 mb-4 text-xs text-black/65">
              Positive integer only. Leave blank for unlimited charges.
            </p>
            <div className="mb-4">
              <SelectDropdown
                id="item-modifies-attribute"
                label="Modifies attribute (optional)"
                placeholder="Attribute"
                value={form.watch("modifiesAttribute")}
                options={attributePathOptions}
                pinValueFirst=""
                menuMaxHeightClass="max-h-56"
                onChange={(v) =>
                  form.setValue("modifiesAttribute", v, {
                    shouldValidate: true,
                  })
                }
              />
            </div>
            <NumberInput
              name="attributeMod"
              label="Attribute mod (optional)"
              allowEmpty
              placeholder="e.g. 1 or −1"
            />
            <div className="mb-6">
              <SelectDropdown
                id="item-modifies-skill"
                label="Modifies general skill (optional)"
                placeholder="Skill"
                value={form.watch("modifiesSkill")}
                options={generalSkillOptions}
                pinValueFirst=""
                menuMaxHeightClass="max-h-56"
                onChange={(v) =>
                  form.setValue("modifiesSkill", v, { shouldValidate: true })
                }
              />
            </div>
            <NumberInput
              name="skillMod"
              label="Skill mod (optional)"
              allowEmpty
              placeholder="e.g. 1 or −1"
            />
            <div className="mb-0">
              <Controller
                name="isSpeedAltered"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onChange={field.onChange}
                    label="Alters speed"
                  />
                )}
              />
              <p className="mt-2 text-xs text-black/65">
                When checked, this item counts as changing the character&apos;s
                speed for rules that care about that flag.
              </p>
            </div>
          </div>

          {status ? (
            <InfoCard className="border-neblirDanger bg-paleBlue/20">
              <p className="text-sm text-black">{status.text}</p>
            </InfoCard>
          ) : null}

          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save changes"
                : "Create item"}
          </Button>
        </form>
      </FormProvider>

      {isEdit ? (
        <Link
          href="/home/super-admin/items/browse"
          className={`${superAdminNavLinkClassName} mt-6`}
        >
          ← Back to items
        </Link>
      ) : null}
    </SuperAdminSectionShell>
  );
}
