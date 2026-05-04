import { Suspense } from "react";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import GameMasterPageClient from "./GameMasterPageClient";

export default function GameMasterPage() {
  return (
    <Suspense
      fallback={
        <PageSection>
          <LoadingState text="Loading..." />
        </PageSection>
      }
    >
      <GameMasterPageClient />
    </Suspense>
  );
}
