import { Suspense } from "react";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import { GameMasterTableSettingsPageClient } from "./GameMasterTableSettingsPageClient";

export default function GameMasterTableSettingsPage() {
  return (
    <Suspense
      fallback={
        <PageSection>
          <LoadingState text="Loading..." />
        </PageSection>
      }
    >
      <GameMasterTableSettingsPageClient />
    </Suspense>
  );
}
