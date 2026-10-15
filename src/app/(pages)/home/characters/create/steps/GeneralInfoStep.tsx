"use client";

import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { coerceNumericFieldValue } from "@/app/components/shared/bumpNumericFieldValue";
import { NumberField } from "@/app/components/shared/NumberField";
import { TextInput } from "@/app/components/shared/TextInput";
import { NumberInput } from "@/app/components/shared/NumberInput";
import { RangeSlider } from "@/app/components/shared/RangeSlider";
import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import { useImageUpload } from "@/hooks/use-image-upload";
import { RELIGIONS, RACES } from "../schemas";
import { useEffect, useMemo, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import {
  getSelectedSpecialAbilityDescription,
  getSpecialAbilityOptionsForRace,
  SIZE_DEFAULTS_BY_RACE,
  HEIGHT_HELP_BY_RACE,
  WEIGHT_HELP_BY_RACE,
} from "@/app/lib/characterGeneralInfo";
import { CharacterStartingWallet } from "./CharacterStartingWallet";

const religionOptions = RELIGIONS.map((r) => ({
  value: r.value,
  label: r.label,
}));
const raceOptions = RACES.map((r) => ({ value: r.value, label: r.label }));

export function GeneralInfoStep() {
  const { control, setValue, watch } =
    useFormContext<CharacterCreationRequest>();
  const imageUpload = useImageUpload("characters");

  const formAvatarKey = watch("generalInformation.avatarKey") ?? "";
  const characterName = watch("generalInformation.name")?.trim() ?? "";
  const selectedRace = watch("generalInformation.race");
  const selectedSpecialAbilityName = watch(
    "generalInformation.specialAbilityName"
  );
  const specialAbilityOptions = useMemo(
    () => getSpecialAbilityOptionsForRace(selectedRace),
    [selectedRace]
  );
  const selectedSpecialAbilityDescription =
    getSelectedSpecialAbilityDescription(selectedSpecialAbilityName);

  // When an upload completes, sync the resulting imageKey into the form.
  // We intentionally do NOT overwrite the form with an empty upload state (prevents
  // clobbering persisted drafts on remount).
  useEffect(() => {
    if (imageUpload.imageKey) {
      setValue("generalInformation.avatarKey", imageUpload.imageKey);
    }
  }, [imageUpload.imageKey, setValue]);

  const previousRaceRef = useRef<string | undefined>(undefined);

  // Apply race defaults only when the user changes race — not on remount when
  // navigating back to this step (which would clobber persisted form values).
  useEffect(() => {
    const previousRace = previousRaceRef.current;
    const raceChanged =
      previousRace !== undefined && previousRace !== selectedRace;
    previousRaceRef.current = selectedRace;

    if (!raceChanged) return;

    const sizeDefaults = SIZE_DEFAULTS_BY_RACE[selectedRace];
    setValue("generalInformation.height", sizeDefaults.height);
    setValue("generalInformation.weight", sizeDefaults.weight);

    if (selectedRace === "HUMAN") {
      setValue("generalInformation.specialAbilityName", "INNATE_MANIPULATION");
    } else if (selectedRace === "KINIAN") {
      setValue("generalInformation.specialAbilityName", "TELEPATHY_DARKVISION");
    } else if (selectedRace === "FENNE") {
      setValue(
        "generalInformation.specialAbilityName",
        "DOUBLE_OPPOSABLE_THUMBS"
      );
    } else if (selectedRace === "MANFENN") {
      if (
        selectedSpecialAbilityName !== "INNATE_MANIPULATION" &&
        selectedSpecialAbilityName !== "DOUBLE_OPPOSABLE_THUMBS"
      ) {
        setValue(
          "generalInformation.specialAbilityName",
          "INNATE_MANIPULATION"
        );
      }
    }
  }, [selectedRace, selectedSpecialAbilityName, setValue]);

  useEffect(() => {
    if (selectedRace !== "MANFENN") return;
    if (
      selectedSpecialAbilityName !== "INNATE_MANIPULATION" &&
      selectedSpecialAbilityName !== "DOUBLE_OPPOSABLE_THUMBS"
    ) {
      setValue("generalInformation.specialAbilityName", "INNATE_MANIPULATION");
    }
  }, [selectedRace, selectedSpecialAbilityName, setValue]);

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
      <div className="mb-6 sm:col-span-2 lg:col-span-3">
        <label
          htmlFor="generalInformation.level"
          className="block font-bold text-black"
        >
          Character level
        </label>
        <p className="mt-1 mb-3 text-sm text-black/70">
          Sets HP rolls, skill points, and path features for your character.
        </p>
        <div className="rounded-md border-2 border-customPrimary/45 bg-paleBlue/30 p-4 shadow-sm">
          <Controller
            name="generalInformation.level"
            control={control}
            render={({ field }) => {
              const value = typeof field.value === "number" ? field.value : 1;
              return (
                <RangeSlider
                  id="generalInformation.level"
                  label=""
                  showLabel={false}
                  value={value}
                  onChange={(v) => field.onChange(v)}
                  allowedMin={1}
                  allowedMax={10}
                  visualMin={1}
                  visualMax={10}
                  step={1}
                  showTicks
                  className="border-0 bg-transparent p-0"
                />
              );
            }}
          />
        </div>
      </div>
      <div className="mb-6 sm:col-span-2 lg:col-span-3">
        <ImageUploadDropzone
          id="character-avatar"
          label="Character image"
          imageKey={formAvatarKey || imageUpload.imageKey}
          previewLayout="characterAvatar"
          previewImageAlt={
            characterName ? `${characterName} avatar` : "Character avatar"
          }
          previewCaption="Avatar preview — this is how it will appear on your character page."
          onFileChange={(file) => {
            void imageUpload.handleFile(file);
            // If the user explicitly removes the image, clear the form value too.
            if (!file) setValue("generalInformation.avatarKey", "");
          }}
          onDrop={imageUpload.handleDrop}
          onDragOver={imageUpload.handleDragOver}
          uploading={imageUpload.uploading}
          error={imageUpload.uploadError}
          variant="light"
        />
      </div>
      <TextInput
        name="generalInformation.name"
        label="Name"
        placeholder="First name"
      />
      <TextInput
        name="generalInformation.surname"
        label="Surname"
        placeholder="Last name"
      />
      <NumberInput name="generalInformation.age" label="Age" min={1} />
      <TextInput
        name="generalInformation.profession"
        label="Profession"
        placeholder="e.g. Engineer"
      />
      <TextInput
        name="generalInformation.birthplace"
        label="Birthplace"
        placeholder="e.g. New Haven"
      />
      <Controller
        name="generalInformation.religion"
        control={control}
        render={({ field }) => (
          <div className="mb-6">
            <SelectDropdown
              id="generalInformation.religion"
              label="Religion"
              placeholder="Select religion"
              value={field.value}
              options={religionOptions}
              onChange={field.onChange}
            />
          </div>
        )}
      />
      <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Controller
          name="generalInformation.race"
          control={control}
          render={({ field }) => (
            <div className="mb-6">
              <SelectDropdown
                id="generalInformation.race"
                label="Race"
                placeholder="Select race"
                value={field.value}
                options={raceOptions}
                onChange={field.onChange}
              />
            </div>
          )}
        />
        <Controller
          name="generalInformation.specialAbilityName"
          control={control}
          render={({ field }) => (
            <div className="mb-6">
              <label
                htmlFor="generalInformation.specialAbilityName"
                className="block font-bold text-black"
              >
                Special Ability
              </label>
              <SelectDropdown
                id="generalInformation.specialAbilityName"
                label="Special Ability"
                showLabel={false}
                placeholder="Select special ability"
                value={field.value ?? ""}
                options={specialAbilityOptions}
                onChange={field.onChange}
              />
              <p className="mt-2 ml-1 text-xs text-black/70">
                {selectedSpecialAbilityDescription}
              </p>
            </div>
          )}
        />
      </div>
      <div className="sm:col-span-2 lg:col-span-2 grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <Controller
          name="generalInformation.height"
          control={control}
          render={({ field }) => (
            <div className="mb-6">
              <label
                htmlFor="generalInformation.height"
                className="block font-bold text-black"
              >
                Height (cm)
              </label>
              <NumberField
                ref={field.ref}
                name={field.name}
                id="generalInformation.height"
                value={field.value == null ? "" : String(field.value)}
                min={1}
                stepperLabel="Height (cm)"
                onBlur={field.onBlur}
                onChange={(raw) =>
                  field.onChange(coerceNumericFieldValue(raw, "int", 1))
                }
              />
              <p className="mt-2 ml-1 text-xs text-black/70">
                {HEIGHT_HELP_BY_RACE[selectedRace]}
              </p>
            </div>
          )}
        />
        <Controller
          name="generalInformation.weight"
          control={control}
          render={({ field }) => (
            <div className="mb-6">
              <label
                htmlFor="generalInformation.weight"
                className="block font-bold text-black"
              >
                Weight (kg)
              </label>
              <NumberField
                ref={field.ref}
                name={field.name}
                id="generalInformation.weight"
                value={field.value == null ? "" : String(field.value)}
                min={1}
                stepperLabel="Weight (kg)"
                onBlur={field.onBlur}
                onChange={(raw) =>
                  field.onChange(coerceNumericFieldValue(raw, "int", 1))
                }
              />
              <p className="mt-2 ml-1 text-xs text-black/70">
                {WEIGHT_HELP_BY_RACE[selectedRace]}
              </p>
            </div>
          )}
        />
      </div>
      <CharacterStartingWallet />
    </div>
  );
}
