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
import type { Vehicle } from "@/app/lib/types/vehicle";
import { richTextToPlainTextPreview } from "@/app/lib/tiptap/richTextPlainTextPreview";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { SuperAdminCatalogueDomainNav } from "../SuperAdminCatalogueDomainNav";
import { SuperAdminCatalogueSearchInput } from "../SuperAdminCatalogueSearchInput";
import { SuperAdminSectionShell } from "../SuperAdminSectionShell";
import { superAdminNavLinkClassName } from "../superAdminNavLinkClass";

type VehicleRow = Vehicle & { id: string; imageKey?: string | null };

async function vehiclesFetcher(url: string): Promise<VehicleRow[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as VehicleRow[];
}

export function SuperAdminBrowseVehiclesClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, error, isLoading, mutate } = useSWR<VehicleRow[]>(
    "/api/vehicles",
    vehiclesFetcher
  );

  const filtered = useMemo(() => {
    const rows = data ?? [];
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? rows.filter((vehicle) => {
          const name = vehicle.name.toLowerCase();
          const brand = vehicle.brand?.toLowerCase() ?? "";
          const desc =
            richTextToPlainTextPreview(vehicle.description)?.toLowerCase() ??
            "";
          return name.includes(q) || brand.includes(q) || desc.includes(q);
        })
      : rows;
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [data, searchQuery]);

  const imageEntries = useMemo(
    () =>
      filtered
        .filter((vehicle) => vehicle.imageKey)
        .map((vehicle) => ({ id: vehicle.id, imageKey: vehicle.imageKey })),
    [filtered]
  );
  const imageUrls = useImageUrls(imageEntries);

  return (
    <SuperAdminSectionShell
      title="Browse official vehicles"
      description="Search by name, brand, or description, then open a vehicle to edit it."
    >
      <SuperAdminCatalogueDomainNav domain="vehicles" active="browse" />

      <SuperAdminCatalogueSearchInput
        id="browse-vehicles-search"
        label="Search vehicles"
        placeholder="Search by name, brand, or description…"
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {isLoading ? (
        <InfoCard>
          <LoadingState text="Loading vehicles…" />
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
          {filtered.map((vehicle) => (
            <ResourceBrowseGridItem key={vehicle.id}>
              <ResourceGridCard
                href={`/home/super-admin/vehicles/${vehicle.id}/edit`}
                title={vehicle.name}
                meta={`${vehicle.vehicleSizeCategory} · ${vehicle.accessType === "GAME_MASTER" ? "GM" : "Player"} · ${vehicle.maxPassengers} passengers`}
                richBody={vehicle.description}
                {...(vehicle.imageKey
                  ? {
                      imageUrl: imageUrls[vehicle.id] ?? undefined,
                      imageAlt: vehicle.name,
                    }
                  : {})}
              />
            </ResourceBrowseGridItem>
          ))}
        </ResourceBrowseGrid>
      ) : null}

      {!isLoading && !error && filtered.length === 0 ? (
        <p className="text-sm text-black/70">
          {searchQuery.trim()
            ? "No vehicles match your search."
            : "No official vehicles in the catalogue yet."}
        </p>
      ) : null}

      <Link
        href="/home/super-admin/vehicles"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        Create new vehicle
      </Link>
    </SuperAdminSectionShell>
  );
}
