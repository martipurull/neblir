"use client";

import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { BOT_COMBAT_FIELDS, type BotCombatStatKey } from "@/app/lib/botCombat";

export function DarkBotCombatFields({
  idPrefix,
  values,
  onChange,
  disabled,
  labelFor,
  required,
}: {
  idPrefix: string;
  values: Record<BotCombatStatKey, string>;
  onChange: (key: BotCombatStatKey, value: string) => void;
  disabled: boolean;
  labelFor: (label: string) => string;
  required: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {BOT_COMBAT_FIELDS.map((field) => (
        <ModalNumberField
          key={field.key}
          id={`${idPrefix}-${field.key}`}
          label={labelFor(field.label)}
          value={values[field.key]}
          onChange={(value) => onChange(field.key, value)}
          disabled={disabled}
          required={required}
          min={field.min}
          max={field.max}
          step={1}
        />
      ))}
    </div>
  );
}
