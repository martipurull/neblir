"use client";

import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { ResourceGridCard } from "@/app/components/shared/ResourceGridCard";
import {
  ResourceBrowseGrid,
  ResourceBrowseGridItem,
} from "@/app/components/shared/ResourceBrowseGrid";
import type { EnemyResponse } from "@/app/lib/types/enemy";
import { richTextToPlainTextPreview } from "@/app/lib/tiptap/richTextPlainTextPreview";
import { useImageUrls } from "@/hooks/use-image-urls";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { SuperAdminCatalogueDomainNav } from "../SuperAdminCatalogueDomainNav";
import { SuperAdminCatalogueSearchInput } from "../SuperAdminCatalogueSearchInput";
import { SuperAdminSectionShell } from "../SuperAdminSectionShell";
import { superAdminNavLinkClassName } from "../superAdminNavLinkClass";

async function enemiesFetcher(url: string): Promise<EnemyResponse[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as EnemyResponse[];
}

export function SuperAdminBrowseEnemiesClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, error, isLoading, mutate } = useSWR<EnemyResponse[]>(
    "/api/enemies",
    enemiesFetcher
  );

  const filtered = useMemo(() => {
    const rows = data ?? [];
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? rows.filter((enemy) => {
          const name = enemy.name.toLowerCase();
          const desc =
            richTextToPlainTextPreview(enemy.description)?.toLowerCase() ?? "";
          return name.includes(q) || desc.includes(q);
        })
      : rows;
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [data, searchQuery]);

  const imageEntries = useMemo(
    () =>
      filtered
        .filter((enemy) => enemy.imageKey)
        .map((enemy) => ({ id: enemy.id, imageKey: enemy.imageKey })),
    [filtered]
  );
  const imageUrls = useImageUrls(imageEntries);

  return (
    <SuperAdminSectionShell
      title="Browse official enemies"
      description="Search by name or description, then open an enemy to edit it."
    >
      <SuperAdminCatalogueDomainNav domain="enemies" active="browse" />

      <SuperAdminCatalogueSearchInput
        id="browse-enemies-search"
        label="Search enemies"
        placeholder="Search by name or description…"
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {isLoading ? (
        <InfoCard>
          <LoadingState text="Loading enemies…" />
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
          {filtered.map((enemy) => (
            <ResourceBrowseGridItem key={enemy.id}>
              <ResourceGridCard
                href={`/home/super-admin/enemies/${enemy.id}/edit`}
                title={enemy.name}
                meta={`HP ${enemy.health} · speed ${enemy.speed}`}
                richBody={enemy.description}
                {...(enemy.imageKey
                  ? {
                      imageUrl: imageUrls[enemy.id] ?? undefined,
                      imageAlt: enemy.name,
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
            ? "No enemies match your search."
            : "No official enemies in the catalogue yet."}
        </p>
      ) : null}

      <Link
        href="/home/super-admin/enemies"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        Create new enemy
      </Link>
    </SuperAdminSectionShell>
  );
}
