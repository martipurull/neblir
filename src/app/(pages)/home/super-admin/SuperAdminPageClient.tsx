"use client";

import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import { PageSubtitle } from "@/app/components/shared/PageSubtitle";
import { PageTitle } from "@/app/components/shared/PageTitle";
import Link from "next/link";
import useSWR from "swr";
import type { CatalogueSyncHubConfig } from "@/app/lib/catalogueSyncEnv";
import { SuperAdminCatalogueSeedExportCard } from "./_components/SuperAdminCatalogueSeedExportCard";
import { SuperAdminCatalogueSyncCard } from "./_components/SuperAdminCatalogueSyncCard";
import { superAdminNavLinkClassName } from "./_components/superAdminNavLinkClass";

type DriftPayload = {
  needsSeedRepoUpdate: boolean;
  touchedDomains: string[];
  updatedAt: string | null;
};

async function driftFetcher(url: string): Promise<DriftPayload> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as DriftPayload;
}

export function SuperAdminPageClient({
  catalogueSync,
  catalogueSyncSource,
  catalogueSyncDest,
}: {
  catalogueSync: CatalogueSyncHubConfig;
  catalogueSyncSource?: string;
  catalogueSyncDest?: string;
}) {
  const { data, error, isLoading, mutate } = useSWR<DriftPayload>(
    "/api/staff/catalogue-drift",
    driftFetcher
  );

  const acknowledge = async () => {
    const res = await fetch("/api/staff/catalogue-drift", { method: "PATCH" });
    if (!res.ok) {
      throw new Error(`Acknowledge failed (${res.status})`);
    }
    await mutate();
  };

  return (
    <PageSection>
      <PageTitle>Super admin</PageTitle>
      <PageSubtitle>
        Official catalogue changes are stored in the database. After you edit
        data here, update the tracked seed files in version control so imports
        do not drift from what ships in the repo.
      </PageSubtitle>

      {isLoading ? (
        <InfoCard>
          <LoadingState text="Loading status…" />
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

      {data?.needsSeedRepoUpdate ? (
        <InfoCard className="!border-neblirWarning bg-paleBlue/20">
          <p className="font-semibold text-black">Update seed data in git</p>
          <p className="mt-2 text-sm text-black/80">
            Catalogue rows were changed via the API. Export or hand-edit the
            official JSON under{" "}
            <code className="rounded bg-black/5 px-1">prisma/data</code> (e.g.{" "}
            <code className="rounded bg-black/5 px-1">
              Reference_Upload.json
            </code>
            ), then commit. Domains touched:{" "}
            <span className="font-medium">
              {data.touchedDomains.length > 0
                ? data.touchedDomains.join(", ")
                : "unknown"}
            </span>
            .
          </p>
          {data.updatedAt ? (
            <p className="mt-1 text-xs text-black/60">
              Last change recorded:{" "}
              {new Date(data.updatedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          ) : null}
          <div className="mt-4">
            <Button
              type="button"
              variant="semanticWarningOutline"
              onClick={() => void acknowledge().catch(() => mutate())}
            >
              I have updated the repo seeds
            </Button>
          </div>
        </InfoCard>
      ) : null}

      {!isLoading && !error && data && !data.needsSeedRepoUpdate ? (
        <InfoCard className="!border-neblirSafe bg-paleBlue/20">
          <p className="text-sm text-black/75">
            No pending seed reminder. Edits to official catalogue will set a
            banner here until you acknowledge after updating git.
          </p>
        </InfoCard>
      ) : null}

      <div className="mt-6">
        <h2 className="mb-4 text-center text-xl font-bold text-black sm:mb-6 sm:text-2xl">
          Browse official catalogue
        </h2>
        <Link
          href="/home/super-admin/items/browse"
          className={superAdminNavLinkClassName}
        >
          Items
        </Link>
        <Link
          href="/home/super-admin/paths/browse"
          className={superAdminNavLinkClassName}
        >
          Paths
        </Link>
        <Link
          href="/home/super-admin/features/browse"
          className={superAdminNavLinkClassName}
        >
          Features
        </Link>
        <Link
          href="/home/super-admin/enemies/browse"
          className={superAdminNavLinkClassName}
        >
          Enemies
        </Link>
        <Link
          href="/home/super-admin/vehicles/browse"
          className={superAdminNavLinkClassName}
        >
          Vehicles
        </Link>
        <Link
          href="/home/super-admin/reference/browse"
          className={superAdminNavLinkClassName}
        >
          Reference entries
        </Link>
        <Link
          href="/home/super-admin/maps/browse"
          className={superAdminNavLinkClassName}
        >
          Maps
        </Link>
      </div>

      <div className="mt-6">
        <h2 className="mb-4 text-center text-xl font-bold text-black sm:mb-6 sm:text-2xl">
          Create official catalogue
        </h2>
        <Link
          href="/home/super-admin/items"
          className={superAdminNavLinkClassName}
        >
          Items
        </Link>
        <Link
          href="/home/super-admin/paths"
          className={superAdminNavLinkClassName}
        >
          Paths
        </Link>
        <Link
          href="/home/super-admin/features"
          className={superAdminNavLinkClassName}
        >
          Features
        </Link>
        <Link
          href="/home/super-admin/enemies"
          className={superAdminNavLinkClassName}
        >
          Enemies
        </Link>
        <Link
          href="/home/super-admin/vehicles"
          className={superAdminNavLinkClassName}
        >
          Vehicles
        </Link>
        <Link
          href="/home/super-admin/reference"
          className={superAdminNavLinkClassName}
        >
          Reference entries
        </Link>
        <Link
          href="/home/super-admin/maps"
          className={superAdminNavLinkClassName}
        >
          Maps
        </Link>
      </div>

      <SuperAdminCatalogueSyncCard
        catalogueSync={catalogueSync}
        initialSource={catalogueSyncSource}
        initialDest={catalogueSyncDest}
      />

      <SuperAdminCatalogueSeedExportCard
        touchedDomains={data?.touchedDomains}
      />

      <InfoCard className="mt-2">
        <p className="text-sm font-semibold text-black">REST endpoints</p>
        <p className="mt-2 text-sm text-black/80">
          Forms POST to{" "}
          <code className="rounded bg-black/5 px-1">/api/items</code>,{" "}
          <code className="rounded bg-black/5 px-1">/api/vehicles</code>,{" "}
          <code className="rounded bg-black/5 px-1">/api/paths</code>,{" "}
          <code className="rounded bg-black/5 px-1">/api/features</code>,{" "}
          <code className="rounded bg-black/5 px-1">/api/enemies</code>,{" "}
          <code className="rounded bg-black/5 px-1">
            /api/reference-entries
          </code>
          , and <code className="rounded bg-black/5 px-1">/api/maps</code>{" "}
          (global rows omit{" "}
          <code className="rounded bg-black/5 px-1">gameId</code>
          ). Bulk JSON for seeds:{" "}
          <code className="rounded bg-black/5 px-1">
            GET /api/staff/catalogue-seed-export?scope=touched|all
          </code>{" "}
          (envelope by default;{" "}
          <code className="rounded bg-black/5 px-1">format=array</code> or{" "}
          <code className="rounded bg-black/5 px-1">format=zip</code> for git
          seed files).
        </p>
      </InfoCard>
    </PageSection>
  );
}
