"use client";

import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";

const textareaClassName =
  "min-h-36 w-full rounded-md border border-black/20 bg-transparent px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover";

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
          You can revisit this later.
        </p>
        <Controller
          name="generalInformation.backstory"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <textarea
              id="generalInformation.backstory"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              onChange={field.onChange}
              value={field.value ?? ""}
              rows={8}
              className={textareaClassName}
              placeholder="Write your character backstory..."
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
          start
        </p>
        <Controller
          name="generalInformation.summary"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <textarea
              id="generalInformation.summary"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              onChange={field.onChange}
              value={field.value ?? ""}
              rows={6}
              className={textareaClassName}
              placeholder="Write your public character description..."
            />
          )}
        />
      </div>
    </div>
  );
}
