"use client";

import { BotModalRangeField } from "@/app/components/games/BotModalRangeField";
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
    <div className="flex flex-col gap-3">
      {BOT_TEMPLATE_TRACK_FIELDS.map((field) => (
        <BotModalRangeField
          key={field.key}
          id={`${idPrefix}-${field.key}`}
          label={labelFor(field.label)}
          value={values[field.key]}
          onChange={(value) => onChange(field.key, value)}
          disabled={disabled}
          allowBlank={!required}
          min={field.min}
          max={field.max}
        />
      ))}
    </div>
  );
}
