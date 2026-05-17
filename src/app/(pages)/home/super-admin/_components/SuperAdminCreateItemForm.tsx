"use client";

import Button from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import InfoCard from "@/app/components/shared/InfoCard";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { GeneralInformationRichTextField } from "@/app/components/character/GeneralInformationRichTextField";
import {
  ATTRIBUTE_OPTIONS,
  GENERAL_SKILL_OPTIONS,
} from "@/app/(pages)/home/characters/[id]/level-up/constants";
import { EQUIP_SLOTS } from "@/app/components/games/shared/itemModalConstants";
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
} from "@/app/lib/types/item";
import { serializeEditorToStoredHtml } from "@/app/lib/tiptap/generalInformationRichText";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  parseCreatedCatalogueId,
  superAdminCatalogueCreatedHref,
} from "../_utils/superAdminCatalogueCreated";
import { superAdminRichEditorScrollClass } from "../_utils/superAdminRichTextEditor";
import { SuperAdminCatalogueImageBlock } from "./SuperAdminCatalogueImageBlock";
import SuperAdminSectionShell from "./SuperAdminSectionShell";
import { SuperAdminWeaponFieldsSection } from "./SuperAdminWeaponFieldsSection";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";

type ItemTypeChoice = "GENERAL_ITEM" | "WEAPON";

type ItemWeaponAttackRollChoice = z.infer<typeof weaponAttackRollTypeSchema>;

type ItemFormValues = {
  itemType: ItemTypeChoice;
  accessType: "PLAYER" | "GAME_MASTER";
  name: string;
  description: string;
  confCost: string;
  costInfo: string;
  weight: string;
  usage: string;
  notes: string;
  attackRoll: ItemWeaponAttackRollChoice[];
  attackMeleeBonus: string;
  attackRangeBonus: string;
  attackThrowBonus: string;
  defenceMeleeBonus: string;
  defenceRangeBonus: string;
  gridAttackBonus: string;
  gridDefenceBonus: string;
  effectiveRange: string;
  maxRange: string;
  damageTypes: string[];
  damageDiceType: string;
  damageNumberOfDice: string;
  equippable: boolean;
  equipSlotTypes: EquipSlotType[];
  equipSlotCost: string;
  maxUses: string;
  modifiesAttribute: string;
  attributeMod: string;
  modifiesSkill: string;
  skillMod: string;
  isSpeedAltered: boolean;
};

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

function optionalIntFromString(s: string): number | undefined {
  const t = s.trim();
  if (t === "") return undefined;
  const n = Number.parseInt(t, 10);
  return Number.isInteger(n) ? n : undefined;
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
  const diceType = Number.parseInt(values.damageDiceType, 10);
  const numberOfDice = Number.parseInt(values.damageNumberOfDice, 10);
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
    put("attackMeleeBonus", optionalIntFromString(values.attackMeleeBonus));
    put("defenceMeleeBonus", optionalIntFromString(values.defenceMeleeBonus));
  }
  if (rolls.includes("RANGE")) {
    put("attackRangeBonus", optionalIntFromString(values.attackRangeBonus));
    put("defenceRangeBonus", optionalIntFromString(values.defenceRangeBonus));
    put("effectiveRange", optionalIntFromString(values.effectiveRange));
    put("maxRange", optionalIntFromString(values.maxRange));
  }
  if (rolls.includes("THROW")) {
    put("attackThrowBonus", optionalIntFromString(values.attackThrowBonus));
  }
  if (rolls.includes("GRID")) {
    put("gridAttackBonus", optionalIntFromString(values.gridAttackBonus));
    put("gridDefenceBonus", optionalIntFromString(values.gridDefenceBonus));
  }
  return out;
}

export default function SuperAdminCreateItemForm() {
  const router = useRouter();
  const imageKeyRef = useRef("");
  const onImageKey = useCallback((key: string) => {
    imageKeyRef.current = key;
  }, []);

  const [status, setStatus] = useState<{
    tone: "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ItemFormValues>({
    defaultValues: {
      itemType: "GENERAL_ITEM",
      accessType: "PLAYER",
      name: "",
      description: "",
      confCost: "0",
      costInfo: "",
      weight: "0",
      usage: "",
      notes: "",
      attackRoll: ["MELEE"],
      attackMeleeBonus: "",
      attackRangeBonus: "",
      attackThrowBonus: "",
      defenceMeleeBonus: "",
      defenceRangeBonus: "",
      gridAttackBonus: "",
      gridDefenceBonus: "",
      effectiveRange: "",
      maxRange: "",
      damageTypes: ["BULLET"],
      damageDiceType: "6",
      damageNumberOfDice: "1",
      equippable: false,
      equipSlotTypes: [],
      equipSlotCost: "",
      maxUses: "",
      modifiesAttribute: "",
      attributeMod: "",
      modifiesSkill: "",
      skillMod: "",
      isSpeedAltered: false,
    },
  });

  const itemType = useWatch({ control: form.control, name: "itemType" });
  const equippable = useWatch({ control: form.control, name: "equippable" });

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus(null);
    const confCost = Number.parseFloat(values.confCost);
    const weight = Number.parseFloat(values.weight);

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

    const attrModTrim = values.attributeMod.trim();
    const attrPathTrim = values.modifiesAttribute.trim();
    if (attrModTrim !== "" && !attrPathTrim) {
      setStatus({
        tone: "error",
        text: "Select an attribute to modify before setting attribute mod.",
      });
      return;
    }

    const skillModTrim = values.skillMod.trim();
    const skillPathTrim = values.modifiesSkill.trim();
    if (skillModTrim !== "" && !skillPathTrim) {
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

    const maxUsesTrim = values.maxUses.trim();
    let maxUsesNum: number | undefined;
    if (maxUsesTrim !== "") {
      const n = Number.parseInt(maxUsesTrim, 10);
      if (!Number.isInteger(n) || n <= 0) {
        setStatus({
          tone: "error",
          text: "Max uses must be a positive integer or left blank for unlimited.",
        });
        return;
      }
      maxUsesNum = n;
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

    let attributeMod: number | undefined;
    if (attrModTrim !== "") {
      const n = Number.parseInt(attrModTrim, 10);
      if (!Number.isInteger(n)) {
        setStatus({
          tone: "error",
          text: "Attribute mod must be a whole number.",
        });
        return;
      }
      attributeMod = n;
    }

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

    let skillMod: number | undefined;
    if (skillModTrim !== "") {
      const n = Number.parseInt(skillModTrim, 10);
      if (!Number.isInteger(n)) {
        setStatus({
          tone: "error",
          text: "Skill mod must be a whole number.",
        });
        return;
      }
      skillMod = n;
    }

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

    const parsed = itemSchema.safeParse(body);
    if (!parsed.success) {
      setStatus({
        tone: "error",
        text: parsed.error.issues.map((i) => i.message).join(". "),
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
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
      title="Create official item"
      description="Description, usage, and notes use the same TipTap editor as character backstory (rich text stored as HTML). General items require usage. Weapons support multiple attack modes, conditional bonuses/ranges, and configurable damage dice."
    >
      <form noValidate onSubmit={(e) => void onSubmit(e)} className="mt-4">
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
              <GeneralInformationRichTextField
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

        <SuperAdminLabeledField
          id="item-conf-cost"
          label="Conf cost"
          register={form.register}
          name="confCost"
          type="number"
        />
        <SuperAdminLabeledField
          id="item-cost-info"
          label="Cost info (optional)"
          register={form.register}
          name="costInfo"
        />
        <SuperAdminLabeledField
          id="item-weight"
          label="Weight"
          register={form.register}
          name="weight"
          type="number"
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
              <GeneralInformationRichTextField
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
              <GeneralInformationRichTextField
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
            register={form.register}
            setValue={form.setValue}
            getValues={form.getValues}
            disabled={submitting}
          />
        ) : null}

        <SuperAdminCatalogueImageBlock
          uploadType="items"
          id="official-item-image"
          label="Item image (optional)"
          disabled={submitting}
          onImageKey={onImageKey}
        />

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
                  const selected = form.watch("equipSlotTypes").includes(slot);
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
          <SuperAdminLabeledField
            id="item-max-uses"
            label="Max uses (optional)"
            register={form.register}
            name="maxUses"
            type="number"
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
                form.setValue("modifiesAttribute", v, { shouldValidate: true })
              }
            />
          </div>
          <SuperAdminLabeledField
            id="item-attribute-mod"
            label="Attribute mod (optional)"
            register={form.register}
            name="attributeMod"
            type="number"
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
          <SuperAdminLabeledField
            id="item-skill-mod"
            label="Skill mod (optional)"
            register={form.register}
            name="skillMod"
            type="number"
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
          {submitting ? "Creating…" : "Create item"}
        </Button>
      </form>
    </SuperAdminSectionShell>
  );
}
