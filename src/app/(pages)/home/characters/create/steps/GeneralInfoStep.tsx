"use client";

import TextInput from "@/app/components/shared/TextInput";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import NumberInput from "@/app/components/shared/NumberInput";
import { RangeSlider } from "@/app/components/shared/RangeSlider";
import { ImageUploadDropzone } from "@/app/components/games/shared/ImageUploadDropzone";
import { useItemImageUpload } from "@/app/components/games/shared/useItemImageUpload";
import { CURRENCY_NAMES, RELIGIONS, RACES } from "../schemas";
import { useImageUrls } from "@/hooks/use-image-urls";
import Image from "next/image";
import React, { useEffect, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";

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

  // When an upload completes, sync the resulting imageKey into the form.
  // We intentionally do NOT overwrite the form with an empty upload state (prevents
  // clobbering persisted drafts on remount).
  useEffect(() => {
    if (imageUpload.imageKey) {
      setValue("generalInformation.avatarKey", imageUpload.imageKey);
    }
  }, [imageUpload.imageKey, setValue]);

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
      <div className="mb-6 sm:col-span-2 lg:col-span-3">
        <Controller
          name="generalInformation.level"
          control={control}
          render={({ field }) => {
            const value = typeof field.value === "number" ? field.value : 1;
            return (
              <RangeSlider
                id="generalInformation.level"
                label="Character level"
                value={value}
                onChange={(v) => field.onChange(v)}
                allowedMin={1}
                allowedMax={10}
                visualMin={1}
                visualMax={10}
                step={1}
                showTicks
              />
            );
          }}
        />
      </div>
      <div className="mb-6 sm:col-span-2 lg:col-span-3">
        <ImageUploadDropzone
          id="character-avatar"
          label="Character image"
          imageKey={formAvatarKey || imageUpload.imageKey}
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
      <TextInput
        name="generalInformation.profession"
        label="Profession"
        placeholder="e.g. Engineer"
      />
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
      <TextInput
        name="generalInformation.birthplace"
        label="Birthplace"
        placeholder="e.g. New Haven"
      />
      <NumberInput
        name="generalInformation.height"
        label="Height (cm)"
        min={1}
      />
      <NumberInput
        name="generalInformation.weight"
        label="Weight (kg)"
        min={1}
      />
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
                        <button
                          type="button"
                          onClick={() => addCurrency(cn)}
                          className="w-44 rounded border border-black/40 px-2 py-1 text-sm hover:bg-black/10"
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
                        </button>
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
                          <input
                            type="number"
                            min={0}
                            value={entry.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                cn,
                                Math.max(0, parseInt(e.target.value, 10) || 0)
                              )
                            }
                            className="ml-auto w-24 rounded-md border border-black/20 bg-paleBlue px-2 py-1 text-right text-sm text-black placeholder:text-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover"
                          />
                          <button
                            type="button"
                            onClick={() => remove(cn)}
                            className="text-xs text-neblirDanger-600 underline"
                          >
                            Remove
                          </button>
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
