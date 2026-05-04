"use client";

import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/app/components/shared/Button";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { characterCreationRequestSchema } from "@/app/api/characters/schemas";
import { getDefaultCharacterCreationFormValues } from "./schemas";
import { CreateCharacterFormContent } from "./CreateCharacterFormContent";
import {
  CREATE_CHARACTER_DRAFT_KEY,
  CREATE_CHARACTER_FEATURES_DRAFT_KEY,
  CREATE_CHARACTER_STEP_DRAFT_KEY,
} from "./characterCreateDraft";

export default function CreateCharacterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const freshStart = searchParams.get("fresh") === "1";
  const form = useForm<CharacterCreationRequest>({
    defaultValues: getDefaultCharacterCreationFormValues(),
    mode: "onTouched",
  });
  const draftValues = useWatch({ control: form.control });

  useEffect(() => {
    if (!freshStart) return;
    try {
      window.localStorage.removeItem(CREATE_CHARACTER_DRAFT_KEY);
      window.localStorage.removeItem(CREATE_CHARACTER_FEATURES_DRAFT_KEY);
      window.localStorage.removeItem(CREATE_CHARACTER_STEP_DRAFT_KEY);
    } catch {
      // ignore
    }
    form.reset(getDefaultCharacterCreationFormValues());
    router.replace("/home/characters/create");
  }, [form, freshStart, router]);

  // Restore/persist draft so refresh doesn't lose progress.
  useEffect(() => {
    if (freshStart) return;
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
  }, [form, freshStart]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        CREATE_CHARACTER_DRAFT_KEY,
        JSON.stringify(draftValues)
      );
    } catch {
      // ignore
    }
  }, [draftValues]);

  return (
    <PageSection>
      <div className="mb-3 flex justify-center">
        <Button
          type="button"
          variant="semanticDangerOutline"
          fullWidth={false}
          onClick={() => router.push("/home/characters")}
          className="text-xs"
        >
          Exit to characters page
        </Button>
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
