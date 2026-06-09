"use client";

import { RichTextField } from "@/app/components/shared/RichTextField";
import { PageSection } from "@/app/components/shared/PageSection";
import { PageTitle } from "@/app/components/shared/PageTitle";
import { Button } from "@/app/components/shared/Button";
import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import { useImageUpload } from "@/hooks/use-image-upload";
import { serializeEditorToStoredHtml } from "@/app/lib/tiptap/richText";
import {
  defaultCreateGameFormValues,
  createGameFormSchema,
  type CreateGameFormValues,
} from "./schemas";
import { createGame } from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import type { UseFormSetError } from "react-hook-form";
import type { z } from "zod";
import { TextInput } from "@/app/components/shared/TextInput";

function optionalPremiseHtml(html: string): string | undefined {
  const trimmed = html.trim();
  if (!trimmed) return undefined;
  const persisted = serializeEditorToStoredHtml(trimmed);
  return persisted || undefined;
}

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

  const imageUpload = useImageUpload("games");
  const {
    imageKey,
    pendingImageKey,
    setPendingImageKey,
    deleteUploadedImage,
    handleFile,
    handleDrop,
    handleDragOver,
  } = imageUpload;

  const { setError, clearErrors, handleSubmit, control } =
    useFormContext<CreateGameFormValues>();

  const onSubmit = async (values: CreateGameFormValues) => {
    clearErrors();
    const premise = optionalPremiseHtml(values.game.premise ?? "");
    const toValidate = {
      game: {
        name: values.game.name,
        premise,
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
      const body: Parameters<typeof createGame>[0] = {
        name: result.data.game.name.trim(),
      };
      if (result.data.game.premise) {
        body.premise = result.data.game.premise;
      }
      if (result.data.game.imageKey) {
        body.imageKey = result.data.game.imageKey;
      }
      const game = await createGame(body);
      router.push(`/home/games/${game.id}`);
    } catch (e) {
      if (pendingImageKey) {
        await deleteUploadedImage(pendingImageKey);
        setPendingImageKey("");
      }
      setSubmitError(getUserSafeErrorMessage(e, "Failed to create game"));
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
        placeholder="e.g. The Lost Expedition"
      />
      <div className="mb-6">
        <label
          htmlFor="game.premise"
          className="mb-1 block font-bold text-black"
        >
          Premise
        </label>
        <p className="mb-2 text-xs text-black/70">
          Optional overview of the game. Use the toolbar for headings, lists,
          and emphasis.
        </p>
        <Controller
          name="game.premise"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <RichTextField
              id="game.premise"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              minHeightClass="min-h-24"
            />
          )}
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
        variant="light"
        previewLayout="cover"
        previewImageAlt="Game cover"
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
