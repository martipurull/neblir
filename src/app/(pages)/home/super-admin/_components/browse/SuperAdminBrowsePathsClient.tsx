"use client";

import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { ResourceGridCard } from "@/app/components/shared/ResourceGridCard";
import {
  ResourceBrowseGrid,
  ResourceBrowseGridItem,
} from "@/app/components/shared/ResourceBrowseGrid";
import type { Path } from "@/app/lib/types/path";
import Link from "next/link";
import useSWR from "swr";
import { SuperAdminCatalogueDomainNav } from "../SuperAdminCatalogueDomainNav";
import { SuperAdminSectionShell } from "../SuperAdminSectionShell";
import { superAdminNavLinkClassName } from "../superAdminNavLinkClass";

async function pathsFetcher(url: string): Promise<Path[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as Path[];
}

export function SuperAdminBrowsePathsClient() {
  const { data, error, isLoading, mutate } = useSWR<Path[]>(
    "/api/paths",
    pathsFetcher
  );

  const paths = [...(data ?? [])].sort((a, b) =>
    String(a.name).localeCompare(String(b.name), undefined, {
      sensitivity: "base",
    })
  );

  return (
    <SuperAdminSectionShell
      title="Browse official paths"
      description="Each path is shown as a card with a short description preview. Select one to edit its description and base feature."
    >
      <SuperAdminCatalogueDomainNav domain="paths" active="browse" />

      {isLoading ? (
        <InfoCard>
          <LoadingState text="Loading paths…" />
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
          {paths.map((path) => (
            <ResourceBrowseGridItem key={path.id}>
              <ResourceGridCard
                href={`/home/super-admin/paths/${path.id}/edit`}
                title={String(path.name)}
                richBody={path.description}
              />
            </ResourceBrowseGridItem>
          ))}
        </ResourceBrowseGrid>
      ) : null}

      {!isLoading && !error && paths.length === 0 ? (
        <p className="text-sm text-black/70">No paths in the catalogue yet.</p>
      ) : null}

      <Link
        href="/home/super-admin/paths"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        Create new path
      </Link>
    </SuperAdminSectionShell>
  );
}
