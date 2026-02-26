import DangerActionFooter from "@/app/components/shared/DangerActionFooter";
import InfoCard from "@/app/components/shared/InfoCard";
import PageSection from "@/app/components/shared/PageSection";
import PageSubtitle from "@/app/components/shared/PageSubtitle";
import PageTitle from "@/app/components/shared/PageTitle";
import React from "react";

const CharactersPage: React.FC = () => {
  return (
    <PageSection>
      <PageTitle>Characters</PageTitle>
      <PageSubtitle>
        Create and manage your character sheets, inventory, and progression.
      </PageSubtitle>
      <InfoCard>
        <p className="text-sm text-gray-600">
          Character details and actions are coming soon.
        </p>
      </InfoCard>
      <DangerActionFooter
        note={
          <>
            Character deletion is permanent and removes all related progress
            from the system.
          </>
        }
        actionLabel="Delete Character"
      />
    </PageSection>
  );
};

export default CharactersPage;
