"use client";

import type { PathName } from "@prisma/client";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { ResourceGridCard } from "@/app/components/shared/ResourceGridCard";
import {
  ResourceBrowseGrid,
  ResourceBrowseGridItem,
} from "@/app/components/shared/ResourceBrowseGrid";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { richTextToPlainTextPreview } from "@/app/lib/tiptap/richTextPlainTextPreview";
import { getCatalogueFeatures } from "@/lib/api/features";
import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { SuperAdminCatalogueDomainNav } from "../SuperAdminCatalogueDomainNav";
import { SuperAdminCatalogueSearchInput } from "../SuperAdminCatalogueSearchInput";
import { SuperAdminSectionShell } from "../SuperAdminSectionShell";
import { PATH_NAME_SELECT_OPTIONS } from "../pathNameSelectOptions";
import { superAdminNavLinkClassName } from "../superAdminNavLinkClass";

const allPathsOption = { value: "", label: "All paths" };

export function SuperAdminBrowseFeaturesClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pathFilter, setPathFilter] = useState("");
  const { data, error, isLoading, mutate } = useSWR("/api/features", () =>
    getCatalogueFeatures()
  );

  const pathFilterOptions = useMemo(
    () => [allPathsOption, ...PATH_NAME_SELECT_OPTIONS],
    []
  );

  const filtered = useMemo(() => {
    const rows = data ?? [];
    const q = searchQuery.trim().toLowerCase();
    const path = pathFilter as PathName | "";
    let list = rows;
    if (path) {
      list = list.filter((f) => f.applicablePaths.includes(path));
    }
    if (q) {
      list = list.filter((f) => {
        const name = f.name.toLowerCase();
        const desc =
          richTextToPlainTextPreview(f.description)?.toLowerCase() ?? "";
        return name.includes(q) || desc.includes(q);
      });
    }
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [data, pathFilter, searchQuery]);

  return (
    <SuperAdminSectionShell
      title="Browse official features"
      description="Filter by applicable path and search by name. Open a feature to edit it."
    >
      <SuperAdminCatalogueDomainNav domain="features" active="browse" />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <SuperAdminCatalogueSearchInput
          id="browse-features-search"
          label="Search features"
          placeholder="Search by name or description…"
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <div>
          <SelectDropdown
            id="browse-features-path"
            label="Applicable path"
            placeholder="All paths"
            value={pathFilter}
            options={pathFilterOptions}
            onChange={setPathFilter}
          />
        </div>
      </div>

      {isLoading ? (
        <InfoCard>
          <LoadingState text="Loading features…" />
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
          {filtered.map((feature) => (
            <ResourceBrowseGridItem key={feature.id}>
              <ResourceGridCard
                href={`/home/super-admin/features/${feature.id}/edit`}
                title={feature.name}
                meta={`Rank ${feature.minPathRank}+ · grade ≤${feature.maxGrade} · ${feature.applicablePaths.join(", ")}`}
                richBody={feature.description}
              />
            </ResourceBrowseGridItem>
          ))}
        </ResourceBrowseGrid>
      ) : null}

      {!isLoading && !error && filtered.length === 0 ? (
        <p className="text-sm text-black/70">
          {searchQuery.trim() || pathFilter
            ? "No features match your filters."
            : "No official features in the catalogue yet."}
        </p>
      ) : null}

      <Link
        href="/home/super-admin/features"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        Create new feature
      </Link>
    </SuperAdminSectionShell>
  );
}
