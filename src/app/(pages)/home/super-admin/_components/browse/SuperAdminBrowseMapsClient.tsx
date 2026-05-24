"use client";

import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { ResourceGridCard } from "@/app/components/shared/ResourceGridCard";
import {
  ResourceBrowseGrid,
  ResourceBrowseGridItem,
} from "@/app/components/shared/ResourceBrowseGrid";
import { useImageUrls } from "@/hooks/use-image-urls";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import SuperAdminCatalogueDomainNav from "../SuperAdminCatalogueDomainNav";
import SuperAdminCatalogueSearchInput from "../SuperAdminCatalogueSearchInput";
import SuperAdminSectionShell from "../SuperAdminSectionShell";
import { superAdminNavLinkClassName } from "../superAdminNavLinkClass";

type MapRow = {
  id: string;
  name: string;
  imageKey: string;
  description?: string | null;
};

async function mapsFetcher(url: string): Promise<MapRow[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as MapRow[];
}

export default function SuperAdminBrowseMapsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, error, isLoading, mutate } = useSWR<MapRow[]>(
    "/api/maps",
    mapsFetcher
  );

  const filtered = useMemo(() => {
    const rows = data ?? [];
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? rows.filter((map) => {
          const name = map.name.toLowerCase();
          const desc = (map.description ?? "").toLowerCase();
          return name.includes(q) || desc.includes(q);
        })
      : rows;
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [data, searchQuery]);

  const imageEntries = useMemo(
    () => filtered.map((map) => ({ id: map.id, imageKey: map.imageKey })),
    [filtered]
  );
  const imageUrls = useImageUrls(imageEntries);

  return (
    <SuperAdminSectionShell
      title="Browse official maps"
      description="Global maps (no game). Search by name, then open a map to edit."
    >
      <SuperAdminCatalogueDomainNav domain="maps" active="browse" />

      <SuperAdminCatalogueSearchInput
        id="browse-maps-search"
        label="Search maps"
        placeholder="Search by name…"
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {isLoading ? (
        <InfoCard>
          <LoadingState text="Loading maps…" />
        </InfoCard>
      ) : null}

      {error ? (
        <InfoCard>
          <ErrorState
            message={error instanceof Error ? error.message : "Load failed"}
            onRetry={() => void mutate()}
            retryLabel="Retry"
          />
        </InfoCard>
      ) : null}

      {!isLoading && !error ? (
        <ResourceBrowseGrid>
          {filtered.map((map) => (
            <ResourceBrowseGridItem key={map.id}>
              <ResourceGridCard
                href={`/home/super-admin/maps/${map.id}/edit`}
                title={map.name}
                richBody={map.description}
                imageUrl={imageUrls[map.id] ?? undefined}
                imageAlt={map.name}
              />
            </ResourceBrowseGridItem>
          ))}
        </ResourceBrowseGrid>
      ) : null}

      {!isLoading && !error && filtered.length === 0 ? (
        <p className="text-sm text-black/70">
          {searchQuery.trim()
            ? "No maps match your search."
            : "No official maps in the catalogue yet."}
        </p>
      ) : null}

      <Link
        href="/home/super-admin/maps"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        Create new map
      </Link>
    </SuperAdminSectionShell>
  );
}
