"use client";

import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import {
  BOT_TEMPLATE_TRACK_FIELDS,
  type BotTrackStatKey,
} from "@/app/lib/botTracks";

export function DarkBotTrackFields({
  idPrefix,
  values,
  onChange,
  disabled,
  labelFor,
  required,
}: {
  idPrefix: string;
  values: Record<BotTrackStatKey, string>;
  onChange: (key: BotTrackStatKey, value: string) => void;
  disabled: boolean;
  labelFor: (label: string) => string;
  required: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {BOT_TEMPLATE_TRACK_FIELDS.map((field) => (
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
