"use client";

import { FormProvider, useForm } from "react-hook-form";
import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOwnedCharacterSheetHref } from "../useOwnedCharacterSheetHref";
import { Button } from "@/app/components/shared/Button";
import { PageSection } from "@/app/components/shared/PageSection";
import { PageTitle } from "@/app/components/shared/PageTitle";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { useCharacter } from "@/hooks/use-character";
import type { CharacterDetail } from "@/app/lib/types/character";
import { CharacterUpdateFormContent } from "./CharacterUpdateFormContent";
import {
  toCharacterUpdateFormValues,
  type CharacterUpdateFormValues,
} from "./schemas";

export default function CharacterUpdatePage() {
  return (
    <Suspense
      fallback={
        <PageSection>
          <LoadingState text="Loading character..." />
        </PageSection>
      }
    >
      <CharacterUpdatePageContent />
    </Suspense>
  );
}

function CharacterUpdatePageContent() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;
  const sheetHref = useOwnedCharacterSheetHref(id);
  const { character, loading, error, refetch } = useCharacter(id);

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
          onClick={() => router.push(sheetHref)}
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
      <CharacterUpdateForm character={character} />
    </PageSection>
  );
}

function CharacterUpdateForm({ character }: { character: CharacterDetail }) {
  const form = useForm<CharacterUpdateFormValues>({
    mode: "onTouched",
    defaultValues: toCharacterUpdateFormValues(character),
  });

  return (
    <FormProvider {...form}>
      <CharacterUpdateFormContent />
    </FormProvider>
  );
}
