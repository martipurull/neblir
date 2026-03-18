"use client";

import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import Button from "@/app/components/shared/Button";
import { ImageUploadDropzone } from "@/app/components/games/shared/ImageUploadDropzone";
import { useItemImageUpload } from "@/app/components/games/shared/useItemImageUpload";
import {
  defaultCreateGameFormValues,
  createGameFormSchema,
  type CreateGameFormValues,
} from "./schemas";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import type { UseFormSetError } from "react-hook-form";
import type { z } from "zod";
import TextInput from "@/app/components/shared/TextInput";

function setZodErrorsOnForm(
  setError: UseFormSetError<CreateGameFormValues>,
  error: z.ZodError
) {
  type FieldPath = "game" | "game.name" | "game.premise" | "game.imageKey";
  for (const issue of error.issues) {
    const path = issue.path.join(".") as FieldPath;
    if (path) setError(path, { message: issue.message });
  }
}

function CreateGameFormContent() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const imageUpload = useItemImageUpload("games");
  const {
    imageKey,
    pendingImageKey,
    setPendingImageKey,
    deleteUploadedImage,
    handleFile,
    handleDrop,
    handleDragOver,
  } = imageUpload;

  const { setError, clearErrors, handleSubmit, register } =
    useFormContext<CreateGameFormValues>();

  const onSubmit = async (values: CreateGameFormValues) => {
    clearErrors();
    const toValidate = {
      game: {
        name: values.game.name,
        premise: values.game.premise?.trim() ?? undefined,
        imageKey: imageKey || undefined,
      },
    };
    const result = createGameFormSchema.safeParse(toValidate);
    if (!result.success) {
      setZodErrorsOnForm(setError, result.error);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const body: { name: string; premise?: string; imageKey?: string } = {
        name: result.data.game.name.trim(),
      };
      if (result.data.game.premise?.trim()) {
        body.premise = result.data.game.premise.trim();
      }
      if (result.data.game.imageKey) {
        body.imageKey = result.data.game.imageKey;
      }
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (pendingImageKey) {
          await deleteUploadedImage(pendingImageKey);
          setPendingImageKey("");
        }
        setSubmitError(data.message ?? "Failed to create game");
        return;
      }
      const game = await res.json();
      router.push(`/home/games/${game.id}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e);
      }}
      className="flex flex-col gap-6"
    >
      <TextInput
        name="game.name"
        label="Game name"
        placeholder="e.g. Starfall Campaign"
      />
      <div className="mb-6">
        <label htmlFor="game.premise" className="block font-bold text-black">
          Premise
        </label>
        <textarea
          id="game.premise"
          {...register("game.premise")}
          placeholder="Brief description or premise of the game"
          rows={4}
          className="mt-1 min-h-24 w-full rounded-md px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover"
        />
      </div>
      <ImageUploadDropzone
        id="game-image"
        label="Cover image"
        imageKey={imageKey}
        onFileChange={(file) => void handleFile(file)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        uploading={imageUpload.uploading}
        error={imageUpload.uploadError}
        disabled={isSubmitting}
      />

      {submitError && (
        <p className="text-sm text-neblirDanger-600" role="alert">
          {submitError}
        </p>
      )}

      <Button type="submit" text={isSubmitting ? "Creating…" : "Create game"} />
    </form>
  );
}

export default function CreateGamePage() {
  const form = useForm<CreateGameFormValues>({
    defaultValues: defaultCreateGameFormValues,
    mode: "onTouched",
  });

  return (
    <PageSection>
      <PageTitle>Create Game</PageTitle>
      <p className="mt-2 mb-6 text-sm text-black/70">
        Add a name, premise, and optional cover image for your game.
      </p>
      <FormProvider {...form}>
        <CreateGameFormContent />
      </FormProvider>
    </PageSection>
  );
}
