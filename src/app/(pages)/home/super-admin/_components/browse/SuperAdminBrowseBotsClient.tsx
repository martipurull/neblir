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
import type { OfficialBot } from "@/app/lib/types/bot";
import { getCatalogueBots } from "@/lib/api/bots";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { SuperAdminCatalogueDomainNav } from "../SuperAdminCatalogueDomainNav";
import { SuperAdminCatalogueSearchInput } from "../SuperAdminCatalogueSearchInput";
import { SuperAdminSectionShell } from "../SuperAdminSectionShell";
import { superAdminNavLinkClassName } from "../superAdminNavLinkClass";

export function SuperAdminBrowseBotsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, error, isLoading, mutate } = useSWR<OfficialBot[]>(
    "/api/bots",
    () => getCatalogueBots()
  );

  const filtered = useMemo(() => {
    const rows = data ?? [];
    const query = searchQuery.trim().toLowerCase();
    const list = query
      ? rows.filter((bot) => {
          const haystack = [bot.name, bot.description, bot.usage ?? ""]
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        })
      : rows;
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
  }, [data, searchQuery]);

  const imageEntries = useMemo(
    () =>
      filtered
        .filter((bot) => bot.imageKey)
        .map((bot) => ({ id: bot.id, imageKey: bot.imageKey })),
    [filtered]
  );
  const imageUrls = useImageUrls(imageEntries);

  return (
    <SuperAdminSectionShell
      title="Browse official bots"
      description="Search by name, description, or usage, then open a bot to edit it. Game-master bots stay in this catalogue."
    >
      <SuperAdminCatalogueDomainNav domain="bots" active="browse" />

      <SuperAdminCatalogueSearchInput
        id="browse-bots-search"
        label="Search bots"
        placeholder="Search by name, description, or usage…"
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {isLoading ? (
        <InfoCard>
          <LoadingState text="Loading bots…" />
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
          {filtered.map((bot) => (
            <ResourceBrowseGridItem key={bot.id}>
              <ResourceGridCard
                href={`/home/super-admin/bots/${bot.id}/edit`}
                title={bot.name}
                meta={`${bot.accessType === "GAME_MASTER" ? "GM" : "Player"} · ${bot.maxHp} HP · ${bot.confCost} CONF`}
                body={bot.description}
                {...(bot.imageKey
                  ? {
                      imageUrl: imageUrls[bot.id] ?? undefined,
                      imageAlt: bot.name,
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
            ? "No bots match your search."
            : "No official bots in the catalogue yet."}
        </p>
      ) : null}

      <Link
        href="/home/super-admin/bots"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        Create new bot
      </Link>
    </SuperAdminSectionShell>
  );
}
