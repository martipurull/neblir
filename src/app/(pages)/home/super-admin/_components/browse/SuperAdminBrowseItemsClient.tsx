"use client";

import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { ResourceGridCard } from "@/app/components/shared/ResourceGridCard";
import {
  ResourceBrowseGrid,
  ResourceBrowseGridItem,
} from "@/app/components/shared/ResourceBrowseGrid";
import type { Item } from "@/app/lib/types/item";
import { richTextToPlainTextPreview } from "@/app/lib/tiptap/richTextPlainTextPreview";
import { useImageUrls } from "@/hooks/use-image-urls";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { SuperAdminCatalogueDomainNav } from "../SuperAdminCatalogueDomainNav";
import { SuperAdminCatalogueSearchInput } from "../SuperAdminCatalogueSearchInput";
import { SuperAdminSectionShell } from "../SuperAdminSectionShell";
import { superAdminNavLinkClassName } from "../superAdminNavLinkClass";

type ItemRow = Item & { id: string; imageKey?: string | null };

async function itemsFetcher(url: string): Promise<ItemRow[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as ItemRow[];
}

export function SuperAdminBrowseItemsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, error, isLoading, mutate } = useSWR<ItemRow[]>(
    "/api/items",
    itemsFetcher
  );

  const filtered = useMemo(() => {
    const rows = data ?? [];
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? rows.filter((item) => {
          const name = item.name.toLowerCase();
          const desc =
            richTextToPlainTextPreview(item.description)?.toLowerCase() ?? "";
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
        .filter((item) => item.imageKey)
        .map((item) => ({ id: item.id, imageKey: item.imageKey })),
    [filtered]
  );
  const imageUrls = useImageUrls(imageEntries);

  return (
    <SuperAdminSectionShell
      title="Browse official items"
      description="Search by name or description, then open an item to edit it."
    >
      <SuperAdminCatalogueDomainNav domain="items" active="browse" />

      <SuperAdminCatalogueSearchInput
        id="browse-items-search"
        label="Search items"
        placeholder="Search by name or description…"
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {isLoading ? (
        <InfoCard>
          <LoadingState text="Loading items…" />
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
          {filtered.map((item) => (
            <ResourceBrowseGridItem key={item.id}>
              <ResourceGridCard
                href={`/home/super-admin/items/${item.id}/edit`}
                title={item.name}
                meta={
                  item.type === "WEAPON"
                    ? `Weapon · ${item.accessType === "GAME_MASTER" ? "GM" : "Player"}`
                    : `General · ${item.accessType === "GAME_MASTER" ? "GM" : "Player"}`
                }
                richBody={item.description}
                {...(item.imageKey
                  ? {
                      imageUrl: imageUrls[item.id] ?? undefined,
                      imageAlt: item.name,
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
            ? "No items match your search."
            : "No official items in the catalogue yet."}
        </p>
      ) : null}

      <Link
        href="/home/super-admin/items"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        Create new item
      </Link>
    </SuperAdminSectionShell>
  );
}
