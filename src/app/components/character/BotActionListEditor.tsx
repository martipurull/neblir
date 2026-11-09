"use client";

import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { NumberField } from "@/app/components/shared/NumberField";
import {
  SelectDropdown,
  type SelectDropdownOption,
} from "@/app/components/shared/SelectDropdown";
import { TextArea } from "@/app/components/shared/TextArea";
import { TextField } from "@/app/components/shared/TextField";
import type { BotAction, BotActionAttribute } from "@/app/lib/types/botAction";
import {
  weaponDamageTypeSchema,
  type WeaponDamageType,
} from "@/app/lib/types/weaponDamage";

const ATTRIBUTE_OPTIONS: SelectDropdownOption<"" | BotActionAttribute>[] = [
  { value: "", label: "None" },
  { value: "processingPower", label: "Processing Power" },
  { value: "physicalPower", label: "Physical Power" },
  { value: "finesseCapacity", label: "Finesse Capacity" },
];

const DAMAGE_TYPE_OPTIONS: SelectDropdownOption<WeaponDamageType>[] =
  weaponDamageTypeSchema.options.map((value) => ({
    value,
    label: value.replace(/_/g, " "),
  }));

function emptyAction(): BotAction {
  return {
    name: "",
    description: null,
    notes: null,
    numberOfDice: 0,
    attribute: null,
    damage: null,
  };
}

function wholeNumber(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
}

function attributeValue(
  attribute: BotActionAttribute | null
): "" | BotActionAttribute {
  return attribute ?? "";
}

function attributeOrNull(
  value: "" | BotActionAttribute
): BotActionAttribute | null {
  return value === "" ? null : value;
}

type BotActionListEditorProps = {
  idPrefix: string;
  title: string;
  hint?: string;
  value: BotAction[];
  onChange: (value: BotAction[]) => void;
  variant?: "light" | "dark";
  disabled?: boolean;
};

export function BotActionListEditor({
  idPrefix,
  title,
  hint,
  value,
  onChange,
  variant = "dark",
  disabled = false,
}: BotActionListEditorProps) {
  const dark = variant === "dark";
  const surface = dark ? "modal" : "page";
  const headingClass = dark
    ? "text-sm font-semibold text-white/90"
    : "text-sm font-semibold text-black";
  const hintClass = dark
    ? "mt-0.5 text-xs text-white/55"
    : "mt-0.5 text-xs text-black/60";
  const cardClass = dark
    ? "rounded border border-white/20 bg-black/25 p-3"
    : "rounded border border-black/15 bg-paleBlue p-3";
  const indexClass = dark
    ? "text-xs font-medium text-white/70"
    : "text-xs font-medium text-black/70";

  const update = (index: number, next: BotAction) => {
    onChange(
      value.map((action, actionIndex) =>
        actionIndex === index ? next : action
      )
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={headingClass}>{title}</h3>
          {hint ? <p className={hintClass}>{hint}</p> : null}
        </div>
        <Button
          type="button"
          variant={dark ? "modalFooterSecondary" : "secondary"}
          fullWidth={false}
          disabled={disabled}
          onClick={() => onChange([...value, emptyAction()])}
        >
          Add action
        </Button>
      </div>
      {value.length === 0 ? (
        <p className={hintClass}>None yet.</p>
      ) : (
        <ul className="space-y-3">
          {value.map((action, index) => {
            const prefix = `${idPrefix}-${index}`;
            const damage = action.damage;
            return (
              <li key={prefix} className={cardClass}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={indexClass}>Action {index + 1}</span>
                  <Button
                    type="button"
                    variant="semanticDangerOutline"
                    fullWidth={false}
                    disabled={disabled}
                    className="!px-2 !py-1 !text-xs"
                    onClick={() =>
                      onChange(
                        value.filter((_, actionIndex) => actionIndex !== index)
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <FieldLabel
                      id={`${prefix}-name`}
                      label="Name"
                      required
                      variant={variant}
                    />
                    <TextField
                      id={`${prefix}-name`}
                      variant={variant}
                      value={action.name}
                      disabled={disabled}
                      onChange={(event) =>
                        update(index, { ...action, name: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel
                      id={`${prefix}-description`}
                      label="Description"
                      variant={variant}
                    />
                    <TextArea
                      id={`${prefix}-description`}
                      variant={variant}
                      rows={2}
                      value={action.description ?? ""}
                      disabled={disabled}
                      onChange={(event) =>
                        update(index, {
                          ...action,
                          description: event.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel
                      id={`${prefix}-notes`}
                      label="Notes"
                      variant={variant}
                    />
                    <TextArea
                      id={`${prefix}-notes`}
                      variant={variant}
                      rows={2}
                      value={action.notes ?? ""}
                      disabled={disabled}
                      onChange={(event) =>
                        update(index, { ...action, notes: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <FieldLabel
                      id={`${prefix}-dice`}
                      label="Number of dice"
                      variant={variant}
                    />
                    <NumberField
                      id={`${prefix}-dice`}
                      variant={variant}
                      min={0}
                      value={action.numberOfDice}
                      disabled={disabled}
                      onChange={(next) =>
                        update(index, {
                          ...action,
                          numberOfDice: wholeNumber(next),
                        })
                      }
                    />
                  </div>
                  <SelectDropdown
                    id={`${prefix}-attribute`}
                    label="Attribute"
                    surface={surface}
                    placeholder="Select an attribute"
                    value={attributeValue(action.attribute)}
                    disabled={disabled}
                    sortOptions={false}
                    options={ATTRIBUTE_OPTIONS}
                    onChange={(next) =>
                      update(index, {
                        ...action,
                        attribute: attributeOrNull(next),
                      })
                    }
                  />
                  <Checkbox
                    checked={damage != null}
                    disabled={disabled}
                    tone={dark ? "inverse" : "default"}
                    label="Damage"
                    onChange={(checked) =>
                      update(index, {
                        ...action,
                        damage: checked
                          ? {
                              numberOfDice: 1,
                              diceType: 6,
                              damageType: "BULLET",
                              attribute: null,
                            }
                          : null,
                      })
                    }
                  />
                  {damage != null ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <FieldLabel
                          id={`${prefix}-damage-dice`}
                          label="Damage dice"
                          variant={variant}
                        />
                        <NumberField
                          id={`${prefix}-damage-dice`}
                          variant={variant}
                          min={0}
                          value={damage.numberOfDice}
                          disabled={disabled}
                          onChange={(next) =>
                            update(index, {
                              ...action,
                              damage: {
                                ...damage,
                                numberOfDice: wholeNumber(next),
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <FieldLabel
                          id={`${prefix}-damage-type-size`}
                          label="Die type"
                          variant={variant}
                        />
                        <NumberField
                          id={`${prefix}-damage-type-size`}
                          variant={variant}
                          min={1}
                          value={damage.diceType}
                          disabled={disabled}
                          onChange={(next) =>
                            update(index, {
                              ...action,
                              damage: {
                                ...damage,
                                diceType: Math.max(1, wholeNumber(next)),
                              },
                            })
                          }
                        />
                      </div>
                      <SelectDropdown
                        id={`${prefix}-damage-kind`}
                        label="Damage type"
                        surface={surface}
                        placeholder="Select a damage type"
                        value={damage.damageType}
                        disabled={disabled}
                        sortOptions={false}
                        options={DAMAGE_TYPE_OPTIONS}
                        onChange={(next) =>
                          update(index, {
                            ...action,
                            damage: {
                              ...damage,
                              damageType: weaponDamageTypeSchema.parse(next),
                            },
                          })
                        }
                      />
                      <SelectDropdown
                        id={`${prefix}-damage-attribute`}
                        label="Damage attribute"
                        surface={surface}
                        placeholder="Select an attribute"
                        value={attributeValue(damage.attribute)}
                        disabled={disabled}
                        sortOptions={false}
                        options={ATTRIBUTE_OPTIONS}
                        onChange={(next) =>
                          update(index, {
                            ...action,
                            damage: {
                              ...damage,
                              attribute: attributeOrNull(next),
                            },
                          })
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type BotActionOverrideEditorProps = {
  idPrefix: string;
  title: string;
  value: BotAction[] | null;
  onChange: (value: BotAction[] | null) => void;
  variant?: "light" | "dark";
  disabled?: boolean;
};

/** Null inherits the template list. An array, including an empty one, replaces it. */
export function BotActionOverrideEditor({
  idPrefix,
  title,
  value,
  onChange,
  variant = "dark",
  disabled = false,
}: BotActionOverrideEditorProps) {
  const dark = variant === "dark";
  return (
    <div className="space-y-3">
      <Checkbox
        checked={value != null}
        disabled={disabled}
        tone={dark ? "inverse" : "default"}
        label={`Override ${title}`}
        onChange={(checked) => onChange(checked ? (value ?? []) : null)}
      />
      {value == null ? (
        <p className={dark ? "text-xs text-white/55" : "text-xs text-black/60"}>
          Inherits the template list.
        </p>
      ) : (
        <BotActionListEditor
          idPrefix={idPrefix}
          title={title}
          value={value}
          onChange={onChange}
          variant={variant}
          disabled={disabled}
        />
      )}
    </div>
  );
}
