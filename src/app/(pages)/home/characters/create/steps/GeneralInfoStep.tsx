"use client";

import { Button } from "@/app/components/shared/Button";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { coerceNumericFieldValue } from "@/app/components/shared/bumpNumericFieldValue";
import { NumberField } from "@/app/components/shared/NumberField";
import { TextInput } from "@/app/components/shared/TextInput";
import { NumberInput } from "@/app/components/shared/NumberInput";
import { RangeSlider } from "@/app/components/shared/RangeSlider";
import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import { useItemImageUpload } from "@/app/components/games/shared/useItemImageUpload";
import { CURRENCY_NAMES, RELIGIONS, RACES } from "../schemas";
import { useImageUrls } from "@/hooks/use-image-urls";
import Image from "next/image";
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

const CURRENCY_LABELS: Record<(typeof CURRENCY_NAMES)[number], string> = {
  CONF: "CONF",
  NORD: "NORD",
  NAS: "NAS",
  HUMF: "HUMF",
  MRARK: "MRARK",
};

const religionOptions = RELIGIONS.map((r) => ({
  value: r.value,
  label: r.label,
}));
const raceOptions = RACES.map((r) => ({ value: r.value, label: r.label }));

export function GeneralInfoStep() {
  const { control, setValue, watch } =
    useFormContext<CharacterCreationRequest>();
  const imageUpload = useItemImageUpload("characters");

  const currencyImageEntries = useMemo(
    () =>
      CURRENCY_NAMES.map((cn) => ({
        id: cn,
        imageKey: `currency-${cn.toLowerCase()}.png`,
      })),
    []
  );
  const currencyImageUrls = useImageUrls(currencyImageEntries);

  const formAvatarKey = watch("generalInformation.avatarKey") ?? "";
  const characterName = watch("generalInformation.name")?.trim() ?? "";
  const avatarImageEntries = useMemo(
    () =>
      formAvatarKey
        ? [{ id: "character-avatar-preview", imageKey: formAvatarKey }]
        : [],
    [formAvatarKey]
  );
  const avatarImageUrls = useImageUrls(avatarImageEntries);
  const avatarPreviewUrl = formAvatarKey
    ? (avatarImageUrls["character-avatar-preview"] ?? null)
    : null;
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
          previewImageUrl={avatarPreviewUrl}
          previewImageAlt={
            characterName ? `${characterName} avatar` : "Character avatar"
          }
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
      <div className="mb-6 sm:col-span-2 lg:col-span-3">
        <p className="mb-2 block font-bold text-black">Money (wallet)</p>
        <p className="mb-2 text-xs text-black/70">
          Disposable income you think your character would have access to. Add
          amounts for any currencies.
        </p>
        <Controller
          name="wallet"
          control={control}
          defaultValue={[]}
          render={({ field }) => {
            const wallet = field.value ?? [];
            const addCurrency = (
              currencyName: (typeof CURRENCY_NAMES)[number]
            ) => {
              if (wallet.some((e) => e.currencyName === currencyName)) return;
              field.onChange([...wallet, { currencyName, quantity: 0 }]);
            };
            const updateQuantity = (currencyName: string, quantity: number) => {
              const next = wallet.map((e) =>
                e.currencyName === currencyName ? { ...e, quantity } : e
              );
              field.onChange(next);
            };
            const remove = (currencyName: string) => {
              field.onChange(
                wallet.filter((e) => e.currencyName !== currencyName)
              );
            };
            return (
              <div className="space-y-2 rounded-md border border-black/20 bg-black/5 p-3">
                {CURRENCY_NAMES.map((cn) => {
                  const entry = wallet.find((e) => e.currencyName === cn);
                  const isAdded = !!entry;
                  const currencyImageUrl = currencyImageUrls[cn] ?? null;
                  return (
                    <div key={cn} className="flex flex-wrap items-center gap-2">
                      {!isAdded ? (
                        <Button
                          type="button"
                          variant="lightCurrencyAddRow"
                          fullWidth={false}
                          onClick={() => addCurrency(cn)}
                        >
                          <span className="inline-flex w-full items-center justify-between gap-2">
                            <span className="truncate">
                              + {CURRENCY_LABELS[cn]}
                            </span>
                            <span className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-paleBlue/60">
                              {currencyImageUrl ? (
                                <Image
                                  src={currencyImageUrl}
                                  alt=""
                                  width={20}
                                  height={20}
                                  className="h-5 w-5 object-cover object-center"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[10px] font-medium text-black">
                                  {cn.charAt(0)}
                                </span>
                              )}
                            </span>
                          </span>
                        </Button>
                      ) : (
                        <>
                          <span className="inline-flex w-44 items-center justify-between gap-2 rounded border border-black/30 bg-black/0 px-2 py-1">
                            <span className="truncate text-sm font-medium">
                              {CURRENCY_LABELS[cn]}
                            </span>
                            <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-paleBlue/60">
                              {currencyImageUrl ? (
                                <Image
                                  src={currencyImageUrl}
                                  alt=""
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 object-cover object-center"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[10px] font-medium text-black">
                                  {cn.charAt(0)}
                                </span>
                              )}
                            </span>
                          </span>
                          <NumberField
                            id={`wallet-qty-${cn}`}
                            min={0}
                            value={entry.quantity}
                            stepperLabel={`${CURRENCY_LABELS[cn]} quantity`}
                            onChange={(raw) =>
                              updateQuantity(
                                cn,
                                Math.max(0, parseInt(raw, 10) || 0)
                              )
                            }
                            className="ml-auto !w-24 shrink-0 !min-h-9"
                            inputClassName="px-2 py-1 text-right text-sm"
                          />
                          <Button
                            type="button"
                            variant="lightDangerLink"
                            fullWidth={false}
                            onClick={() => remove(cn)}
                          >
                            Remove
                          </Button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
