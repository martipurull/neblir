"use client";

import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import ResourceGridCard from "@/app/components/shared/ResourceGridCard";
import {
  ResourceBrowseGrid,
  ResourceBrowseGridItem,
} from "@/app/components/shared/ResourceBrowseGrid";
import type { ReferenceCategory } from "@/app/lib/types/reference";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import SuperAdminCatalogueDomainNav from "../SuperAdminCatalogueDomainNav";
import SuperAdminCatalogueSearchInput from "../SuperAdminCatalogueSearchInput";
import SuperAdminSectionShell from "../SuperAdminSectionShell";
import { superAdminNavLinkClassName } from "../superAdminNavLinkClass";

type ReferenceRow = {
  id: string;
  title: string;
  slug: string;
  category: ReferenceCategory;
  summary?: string | null;
};

async function referenceFetcher(url: string): Promise<ReferenceRow[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as ReferenceRow[];
}

export default function SuperAdminBrowseReferenceClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, error, isLoading, mutate } = useSWR<ReferenceRow[]>(
    "/api/reference-entries?scope=official",
    referenceFetcher
  );

  const filtered = useMemo(() => {
    const rows = data ?? [];
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? rows.filter((entry) => {
          const title = entry.title.toLowerCase();
          const slug = entry.slug.toLowerCase();
          return title.includes(q) || slug.includes(q);
        })
      : rows;
    return [...list].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
    );
  }, [data, searchQuery]);

  return (
    <SuperAdminSectionShell
      title="Browse official reference entries"
      description="Global mechanics and world entries. Search by title or slug, then open one to edit."
    >
      <SuperAdminCatalogueDomainNav domain="reference" active="browse" />

      <SuperAdminCatalogueSearchInput
        id="browse-reference-search"
        label="Search reference entries"
        placeholder="Search by title or slug…"
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {isLoading ? (
        <InfoCard>
          <LoadingState text="Loading reference entries…" />
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
          {filtered.map((entry) => (
            <ResourceBrowseGridItem key={entry.id}>
              <ResourceGridCard
                href={`/home/super-admin/reference/${entry.id}/edit`}
                title={entry.title}
                meta={`${entry.category} · ${entry.slug}`}
                bodyLabel="Summary"
                richBody={entry.summary}
              />
            </ResourceBrowseGridItem>
          ))}
        </ResourceBrowseGrid>
      ) : null}

      {!isLoading && !error && filtered.length === 0 ? (
        <p className="text-sm text-black/70">
          {searchQuery.trim()
            ? "No reference entries match your search."
            : "No official reference entries yet."}
        </p>
      ) : null}

      <Link
        href="/home/super-admin/reference"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        Create new reference entry
      </Link>
    </SuperAdminSectionShell>
  );
}
