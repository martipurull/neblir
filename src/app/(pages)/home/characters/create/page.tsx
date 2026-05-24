import { Suspense } from "react";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import CreateCharacterPageClient from "./CreateCharacterPageClient";

export default function CreateCharacterPage() {
  return (
    <Suspense
      fallback={
        <PageSection>
          <LoadingState text="Loading..." />
        </PageSection>
      }
    >
      <CreateCharacterPageClient />
    </Suspense>
  );
}
