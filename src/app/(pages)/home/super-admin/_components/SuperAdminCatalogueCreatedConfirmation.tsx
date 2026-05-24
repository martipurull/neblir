"use client";

import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { appButtonVariantClassName } from "@/app/components/shared/buttonStyles";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import type { SuperAdminCatalogueCreatedKind } from "../_utils/superAdminCatalogueCreated";
import { SuperAdminSeedJsonDownloadButton } from "./SuperAdminSeedJsonDownloadButton";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";

export type { SuperAdminCatalogueCreatedKind };

const linkAsPrimaryButton =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md px-4 text-center font-medium sm:w-auto sm:min-w-[12rem]";

const linkAsSecondaryButton =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md px-4 text-center font-medium sm:w-auto sm:min-w-[12rem]";

const CATALOGUE_CREATED_CONFIG: Record<
  SuperAdminCatalogueCreatedKind,
  {
    title: string;
    titleWithRecord: string;
    description: string;
    noIdDescription: string;
    noIdMessage: string;
    createAnotherLabel: string;
    createInitialLabel: string;
    createFormHref: string;
    apiSegment: string;
    filenamePrefix: string;
    loadingText: string;
    savedFallback: string;
    recordLabelField: "name" | "title";
  }
> = {
  item: {
    title: "Item created",
    titleWithRecord: "Official item created",
    description:
      "The item is saved in the catalogue. Download JSON for seed data when you are ready to commit it to the repo.",
    noIdDescription:
      "This page is opened after you create an official item from the form.",
    noIdMessage:
      "No item id was provided. Use the create form, or open this page from the success redirect after creating an item.",
    createAnotherLabel: "Create another item",
    createInitialLabel: "Create an item",
    createFormHref: "/home/super-admin/items",
    apiSegment: "items",
    filenamePrefix: "item",
    loadingText: "Loading item…",
    savedFallback: "this item",
    recordLabelField: "name",
  },
  feature: {
    title: "Feature created",
    titleWithRecord: "Feature created",
    description:
      "The feature is saved in the catalogue. Download JSON for seed data when you are ready to commit it to the repo.",
    noIdDescription:
      "This page is opened after you create a feature from the form.",
    noIdMessage:
      "No feature id was provided. Use the create form, or open this page from the success redirect after creating a feature.",
    createAnotherLabel: "Create another feature",
    createInitialLabel: "Create a feature",
    createFormHref: "/home/super-admin/features",
    apiSegment: "features",
    filenamePrefix: "feature",
    loadingText: "Loading feature…",
    savedFallback: "this feature",
    recordLabelField: "name",
  },
  path: {
    title: "Path created",
    titleWithRecord: "Path created",
    description:
      "The path is saved in the catalogue. Download JSON for seed data when you are ready to commit it to the repo.",
    noIdDescription:
      "This page is opened after you create a path from the form.",
    noIdMessage:
      "No path id was provided. Use the create form, or open this page from the success redirect after creating a path.",
    createAnotherLabel: "Create another path",
    createInitialLabel: "Create a path",
    createFormHref: "/home/super-admin/paths",
    apiSegment: "paths",
    filenamePrefix: "path",
    loadingText: "Loading path…",
    savedFallback: "this path",
    recordLabelField: "name",
  },
  enemy: {
    title: "Enemy created",
    titleWithRecord: "Official enemy created",
    description:
      "The enemy template is saved in the catalogue. Download JSON for seed data when you are ready to commit it to the repo.",
    noIdDescription:
      "This page is opened after you create an official enemy from the form.",
    noIdMessage:
      "No enemy id was provided. Use the create form, or open this page from the success redirect after creating an enemy.",
    createAnotherLabel: "Create another enemy",
    createInitialLabel: "Create an enemy",
    createFormHref: "/home/super-admin/enemies",
    apiSegment: "enemies",
    filenamePrefix: "enemy",
    loadingText: "Loading enemy…",
    savedFallback: "this enemy",
    recordLabelField: "name",
  },
  map: {
    title: "Map created",
    titleWithRecord: "Global map created",
    description:
      "The map is saved in the catalogue. Download JSON for seed data when you are ready to commit it to the repo.",
    noIdDescription:
      "This page is opened after you create a global map from the form.",
    noIdMessage:
      "No map id was provided. Use the create form, or open this page from the success redirect after creating a map.",
    createAnotherLabel: "Create another map",
    createInitialLabel: "Create a map",
    createFormHref: "/home/super-admin/maps",
    apiSegment: "maps",
    filenamePrefix: "map",
    loadingText: "Loading map…",
    savedFallback: "this map",
    recordLabelField: "name",
  },
  reference: {
    title: "Reference entry created",
    titleWithRecord: "Global reference entry created",
    description:
      "The reference entry is saved in the catalogue. Download JSON for seed data when you are ready to commit it to the repo.",
    noIdDescription:
      "This page is opened after you create a global reference entry from the form.",
    noIdMessage:
      "No reference entry id was provided. Use the create form, or open this page from the success redirect after creating an entry.",
    createAnotherLabel: "Create another reference entry",
    createInitialLabel: "Create a reference entry",
    createFormHref: "/home/super-admin/reference",
    apiSegment: "reference-entries",
    filenamePrefix: "reference-entry",
    loadingText: "Loading reference entry…",
    savedFallback: "this reference entry",
    recordLabelField: "title",
  },
};

function formatSavedRecordLabel(
  data: Record<string, unknown>,
  field: "name" | "title"
): string | null {
  const value = data[field];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function fetchCatalogueRecord(
  url: string
): Promise<Record<string, unknown>> {
  const res = await fetch(url);
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) {
    throw new Error(
      typeof body?.message === "string"
        ? body.message
        : `Request failed (${res.status})`
    );
  }
  return body as Record<string, unknown>;
}

export function SuperAdminCatalogueCreatedConfirmation({
  kind,
}: {
  kind: SuperAdminCatalogueCreatedKind;
}) {
  const config = CATALOGUE_CREATED_CONFIG[kind];
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/${config.apiSegment}/${id}` : null,
    fetchCatalogueRecord
  );

  if (!id) {
    return (
      <SuperAdminSectionShell
        title={config.title}
        description={config.noIdDescription}
      >
        <InfoCard className="border-neblirWarning bg-paleBlue/20">
          <p className="text-sm text-black">{config.noIdMessage}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={config.createFormHref}
              className={`${linkAsPrimaryButton} ${appButtonVariantClassName.primary}`}
            >
              {config.createInitialLabel}
            </Link>
            <Link
              href="/home/super-admin"
              className={`${linkAsSecondaryButton} ${appButtonVariantClassName.secondary}`}
            >
              Super admin hub
            </Link>
          </div>
        </InfoCard>
      </SuperAdminSectionShell>
    );
  }

  const savedLabel = data
    ? formatSavedRecordLabel(data, config.recordLabelField)
    : null;

  return (
    <SuperAdminSectionShell
      title={config.titleWithRecord}
      description={config.description}
    >
      {isLoading ? (
        <InfoCard>
          <LoadingState text={config.loadingText} />
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

      {data && !isLoading ? (
        <>
          <InfoCard className="border-neblirSafe bg-paleBlue/20">
            <p className="font-medium text-black">
              Saved {savedLabel ? `“${savedLabel}”` : config.savedFallback}.
            </p>
            <p className="mt-2 text-sm text-black/80">
              Catalogue id:{" "}
              <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs">
                {id}
              </code>
            </p>
          </InfoCard>

          <div className="mt-6">
            <SuperAdminSeedJsonDownloadButton
              record={data}
              filenamePrefix={config.filenamePrefix}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={config.createFormHref}
              className={`${linkAsPrimaryButton} ${appButtonVariantClassName.primary}`}
            >
              {config.createAnotherLabel}
            </Link>
            <Link
              href="/home/super-admin"
              className={`${linkAsSecondaryButton} ${appButtonVariantClassName.secondary}`}
            >
              Super admin hub
            </Link>
          </div>
        </>
      ) : null}
    </SuperAdminSectionShell>
  );
}
