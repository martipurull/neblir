"use client";

import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import Button from "@/app/components/shared/Button";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import { useCharacter } from "@/hooks/use-character";
import { CharacterUpdateFormContent } from "./CharacterUpdateFormContent";
import {
  toCharacterUpdateFormValues,
  type CharacterUpdateFormValues,
} from "./schemas";

export default function CharacterUpdatePage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;
  const { character, loading, error, refetch } = useCharacter(id);

  const form = useForm<CharacterUpdateFormValues>({
    mode: "onTouched",
  });

  React.useEffect(() => {
    if (!character) return;
    form.reset(toCharacterUpdateFormValues(character));
  }, [character, form]);

  if (id == null) {
    return (
      <PageSection>
        <p className="text-sm text-neblirDanger-600">Invalid character.</p>
      </PageSection>
    );
  }

  if (loading) {
    return (
      <PageSection>
        <LoadingState text="Loading character..." />
      </PageSection>
    );
  }

  if (error || !character) {
    return (
      <PageSection>
        <ErrorState
          message={error ?? "Character not found"}
          onRetry={refetch}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <div className="mb-3 flex justify-center">
        <Button
          type="button"
          variant="semanticDangerOutline"
          fullWidth={false}
          onClick={() => router.push(`/home/characters/${id}`)}
          className="text-xs"
        >
          Exit to character page
        </Button>
      </div>
      <div className="lg:text-center lg:my-4">
        <PageTitle>Update Character</PageTitle>
        <p className="mt-2 mb-6 text-sm text-black/70">
          Update your editable character information across each section.
        </p>
      </div>
      <FormProvider {...form}>
        <CharacterUpdateFormContent />
      </FormProvider>
    </PageSection>
  );
}
