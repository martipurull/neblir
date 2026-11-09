"use client";

import { BotModalRangeField } from "@/app/components/games/BotModalRangeField";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import {
  BOT_COMBAT_FIELDS,
  BOT_REACTION_CAP_NAME,
  botReactionCapLabel,
  type BotCombatStatKey,
} from "@/app/lib/botCombat";

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
    <div className="flex flex-col gap-3">
      {BOT_COMBAT_FIELDS.map((field) =>
        field.key === "numberOfReactions" ? (
          <ModalNumberField
            key={field.key}
            id={`${idPrefix}-${field.key}`}
            label={botReactionCapLabel(labelFor(BOT_REACTION_CAP_NAME))}
            value={values.numberOfReactions}
            onChange={(value) => onChange("numberOfReactions", value)}
            disabled={disabled}
            required={required}
            min={field.min}
            step={1}
          />
        ) : (
          <BotModalRangeField
            key={field.key}
            id={`${idPrefix}-${field.key}`}
            label={labelFor(field.label)}
            value={values[field.key]}
            onChange={(value) => onChange(field.key, value)}
            disabled={disabled}
            allowBlank={!required}
            min={field.min}
            max={field.max ?? field.min}
          />
        )
      )}
    </div>
  );
}
