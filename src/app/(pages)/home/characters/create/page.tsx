"use client";

import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import { DangerButton } from "@/app/components/shared/SemanticActionButton";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { characterCreationRequestSchema } from "@/app/api/characters/schemas";
import { getDefaultCharacterCreationFormValues } from "./schemas";
import { CreateCharacterFormContent } from "./CreateCharacterFormContent";
import { CREATE_CHARACTER_DRAFT_KEY } from "./characterCreateDraft";

export default function CreateCharacterPage() {
  const router = useRouter();
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
      <div className="mb-3 flex justify-center">
        <DangerButton
          type="button"
          onClick={() => router.push("/home/characters")}
          className="text-xs"
        >
          Exit to characters page
        </DangerButton>
      </div>
      <div className="lg:text-center lg:my-4">
        <PageTitle>Create Character</PageTitle>
        <p className="mt-2 mb-6 text-sm text-black/70">
          Fill in each step. You can go back to change earlier steps.
        </p>
      </div>
      <FormProvider {...form}>
        <CreateCharacterFormContent />
      </FormProvider>
    </PageSection>
  );
}
