"use client";

import { Button } from "@/app/components/shared/Button";
import {
  appButtonVariantClassName,
  linkAsModalActionBlockClassName,
} from "@/app/components/shared/buttonStyles";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { ModalSelect } from "@/app/components/games/shared/ModalSelect";
import { CATALOGUE_EXPORT_DOMAIN_ORDER } from "@/app/lib/catalogueExportResolve";
import type { CatalogueExportDomain } from "@/app/lib/catalogueExportResolve";
import type { CatalogueSyncPreviewResponse } from "@/app/lib/catalogueSyncDiff";
import type {
  CatalogueEnvironment,
  CatalogueSyncHubConfig,
} from "@/app/lib/catalogueSyncEnv";
import { CATALOGUE_ENVIRONMENT_LABELS } from "@/app/lib/catalogueSyncEnv";
import {
  getUserSafeApiError,
  getUserSafeErrorMessage,
} from "@/lib/userSafeError";
import { useState } from "react";

const DOMAIN_LABELS: Record<CatalogueExportDomain, string> = {
  items: "Items",
  vehicles: "Vehicles",
  enemies: "Enemies",
  paths: "Paths",
  features: "Features",
  maps: "Maps",
  reference: "Published reference entries",
};

const BUCKET_LABELS = {
  added: "Added",
  updated: "Updated",
  "dest-only": "Dest-only",
  blocked: "Blocked",
} as const;

function environmentLabel(
  environment: CatalogueEnvironment,
  thisEnvironment: CatalogueEnvironment | null
): string {
  const label = CATALOGUE_ENVIRONMENT_LABELS[environment];
  return environment === thisEnvironment ? `${label} (this process)` : label;
}

async function fetchPreview(
  source: CatalogueEnvironment,
  dest: CatalogueEnvironment
): Promise<CatalogueSyncPreviewResponse> {
  const params = new URLSearchParams({ source, dest });
  const res = await fetch(`/api/staff/catalogue-sync?${params.toString()}`);
  const body = (await res.json().catch(() => undefined)) as
    | (CatalogueSyncPreviewResponse & { message?: string })
    | undefined;
  if (!res.ok) {
    const fallback = "Failed to preview Catalogue sync.";
    const fromBody =
      typeof body?.message === "string" ? body.message : fallback;
    throw new Error(
      res.status >= 500
        ? getUserSafeErrorMessage(fromBody, fallback)
        : getUserSafeApiError(res.status, body, fallback)
    );
  }
  return body as CatalogueSyncPreviewResponse;
}

export function SuperAdminCatalogueSyncModal({
  isOpen,
  onClose,
  catalogueSync,
  initialSource,
  initialDest,
}: {
  isOpen: boolean;
  onClose: () => void;
  catalogueSync: CatalogueSyncHubConfig;
  initialSource: CatalogueEnvironment | "";
  initialDest: CatalogueEnvironment | "";
}) {
  const [source, setSource] = useState<CatalogueEnvironment | "">(
    initialSource
  );
  const [dest, setDest] = useState<CatalogueEnvironment | "">(initialDest);
  const [preview, setPreview] = useState<CatalogueSyncPreviewResponse | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const samePairing = source !== "" && dest !== "" && source === dest;
  const canPreview = source !== "" && dest !== "" && !samePairing && !isLoading;

  const sourceOptions = catalogueSync.sources.map((environment) => ({
    value: environment,
    label: environmentLabel(environment, catalogueSync.thisEnvironment),
  }));
  const destOptions = catalogueSync.destinations.map((environment) => ({
    value: environment,
    label: environmentLabel(environment, catalogueSync.thisEnvironment),
  }));

  const runPreview = async () => {
    if (source === "" || dest === "" || source === dest) return;
    setIsLoading(true);
    setErrorMessage(null);
    setShowDetails(false);
    try {
      const result = await fetchPreview(source, dest);
      setPreview(result);
    } catch (error) {
      setPreview(null);
      setErrorMessage(getUserSafeErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const totals = preview?.domains ? preview.totals : undefined;
  const detailRows = preview?.domains
    ? CATALOGUE_EXPORT_DOMAIN_ORDER.flatMap((domain) =>
        (preview.domains?.[domain]?.rows ?? []).map((row) => ({
          ...row,
          domain,
        }))
      )
    : [];

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Catalogue sync"
      titleId="catalogue-sync-title"
      subtitle="Preview Official overlay from a source Catalogue environment onto a destination. This does not write dest."
      maxWidthClass="max-w-lg"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="modalFooterSecondary"
            fullWidth={false}
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            type="button"
            variant="modalFooterPrimary"
            fullWidth={false}
            disabled
          >
            Apply
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <ModalSelect
          id="catalogue-sync-source"
          label="Source"
          placeholder="Select source"
          value={source}
          options={sourceOptions}
          onChange={(value) => {
            setSource(value as CatalogueEnvironment);
            setPreview(null);
            setErrorMessage(null);
            setShowDetails(false);
          }}
        />
        <ModalSelect
          id="catalogue-sync-dest"
          label="Destination"
          placeholder="Select destination"
          value={dest}
          options={destOptions}
          onChange={(value) => {
            setDest(value as CatalogueEnvironment);
            setPreview(null);
            setErrorMessage(null);
            setShowDetails(false);
          }}
        />
        {samePairing ? (
          <p className="text-sm text-neblirDanger-400" role="alert">
            Source and destination Catalogue environments must differ.
          </p>
        ) : null}
        <Button
          type="button"
          variant="modalBlockPrimary"
          disabled={!canPreview}
          onClick={() => void runPreview()}
        >
          {isLoading ? "Diffing…" : "Diff"}
        </Button>
        {errorMessage ? (
          <p className="text-sm text-neblirDanger-400" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {preview && !preview.destIsThisEnvironment ? (
          <div className="space-y-2 text-sm text-white/90">
            <p>
              Diff and apply run only on the destination Catalogue environment.
              Apply is off here.
            </p>
            {preview.destHubUrl ? (
              <a
                href={preview.destHubUrl}
                className={`${linkAsModalActionBlockClassName} ${appButtonVariantClassName.modalActionBlock}`}
              >
                Open destination super-admin with this pairing
              </a>
            ) : (
              <p>
                Open super-admin on {CATALOGUE_ENVIRONMENT_LABELS[preview.dest]}{" "}
                with this pairing to preview and apply.
              </p>
            )}
          </div>
        ) : null}
        {preview?.destIsThisEnvironment && totals ? (
          <div className="space-y-3 text-sm text-white">
            <p className="font-medium">Official overlay</p>
            <p>
              Added {totals.added}, updated {totals.updated}, dest-only{" "}
              {totals.destOnly}, blocked {totals.blocked}.
            </p>
            <ul className="space-y-1 text-white/90">
              {CATALOGUE_EXPORT_DOMAIN_ORDER.map((domain) => {
                const counts = preview.domains?.[domain];
                if (!counts) return null;
                return (
                  <li key={domain}>
                    {DOMAIN_LABELS[domain]}: added {counts.added}, updated{" "}
                    {counts.updated}, dest-only {counts.destOnly}, blocked{" "}
                    {counts.blocked}
                  </li>
                );
              })}
            </ul>
            <Button
              type="button"
              variant="modalFooterSecondary"
              fullWidth={false}
              onClick={() => setShowDetails((open) => !open)}
            >
              {showDetails ? "Hide details" : "Show details"}
            </Button>
            {showDetails ? (
              detailRows.length === 0 ? (
                <p className="text-white/80">No differing Official rows.</p>
              ) : (
                <ul className="space-y-2">
                  {detailRows.map((row) => (
                    <li key={`${row.domain}-${row.id}-${row.bucket}`}>
                      <span className="font-medium">{row.label}</span>{" "}
                      <span className="text-white/70">({row.id})</span> —{" "}
                      {BUCKET_LABELS[row.bucket]} · {DOMAIN_LABELS[row.domain]}
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
