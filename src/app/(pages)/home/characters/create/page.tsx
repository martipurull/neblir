"use client";

import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { characterCreationRequestSchema } from "@/app/api/characters/schemas";
import { getDefaultCharacterCreationFormValues } from "./schemas";
import { CreateCharacterFormContent } from "./CreateCharacterFormContent";
import { CREATE_CHARACTER_DRAFT_KEY } from "./characterCreateDraft";

export default function CreateCharacterPage() {
  const form = useForm<CharacterCreationRequest>({
    defaultValues: getDefaultCharacterCreationFormValues(),
    mode: "onTouched",
  });

  // Restore/persist draft so refresh doesn't lose progress.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CREATE_CHARACTER_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      const res = characterCreationRequestSchema.safeParse(parsed);
      if (res.success) {
        form.reset(res.data);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const sub = form.watch((values) => {
      try {
        window.localStorage.setItem(
          CREATE_CHARACTER_DRAFT_KEY,
          JSON.stringify(values)
        );
      } catch {
        // ignore
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

  return (
    <PageSection>
      <PageTitle>Create Character</PageTitle>
      <p className="mt-2 mb-6 text-sm text-black/70">
        Fill in each step. You can go back to change earlier steps.
      </p>
      <FormProvider {...form}>
        <CreateCharacterFormContent />
      </FormProvider>
    </PageSection>
  );
}
