"use client";

import { MapsList } from "@/app/components/maps/MapsList";
import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import { useMaps } from "@/hooks/use-maps";
import React from "react";

export default function MapsPage() {
  const { maps, loading, error, refetch } = useMaps();

  return (
    <PageSection>
      <PageTitle>Maps</PageTitle>
      <p className="mt-2 text-sm text-black/75">
        Official Neblir maps available for play.
      </p>

      {loading ? (
        <InfoCard>
          <LoadingState text="Loading maps..." />
        </InfoCard>
      ) : error ? (
        <InfoCard>
          <ErrorState message={error} onRetry={refetch} />
        </InfoCard>
      ) : maps.length === 0 ? (
        <InfoCard>
          <p className="text-sm text-black/70">No maps found.</p>
        </InfoCard>
      ) : (
        <MapsList maps={maps} />
      )}
    </PageSection>
  );
}
