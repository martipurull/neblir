"use client";

import { GeneralInformationRichTextField } from "@/app/components/character/GeneralInformationRichTextField";
import { Controller, useFormContext } from "react-hook-form";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";

export function BackstoryStep() {
  const { control } = useFormContext<CharacterCreationRequest>();

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="generalInformation.backstory"
          className="mb-1 block font-bold text-black"
        >
          Backstory
        </label>
        <p className="mb-2 text-xs text-black/70">
          For your eyes only: what&apos;s your character story, how did they get
          to be in this adventure, what motivates them, what are they scared of?
          You can revisit this later. Use the toolbar for headings, lists, and
          emphasis.
        </p>
        <Controller
          name="generalInformation.backstory"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <GeneralInformationRichTextField
              id="generalInformation.backstory"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              minHeightClass="min-h-36"
            />
          )}
        />
      </div>

      <div>
        <label
          htmlFor="generalInformation.summary"
          className="mb-1 block font-bold text-black"
        >
          Public description
        </label>
        <p className="mb-2 text-xs text-black/70">
          What other players will see and know about your character from the
          start. Rich text is stored as HTML and shown on game rosters.
        </p>
        <Controller
          name="generalInformation.summary"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <GeneralInformationRichTextField
              id="generalInformation.summary"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              minHeightClass="min-h-28"
            />
          )}
        />
      </div>
    </div>
  );
}
