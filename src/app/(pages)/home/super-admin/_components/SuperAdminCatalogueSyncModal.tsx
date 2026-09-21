"use client";

import { Button } from "@/app/components/shared/Button";
import {
  appButtonVariantClassName,
  linkAsModalActionBlockClassName,
} from "@/app/components/shared/buttonStyles";
import { DangerConfirmModal } from "@/app/components/shared/DangerConfirmModal";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { ModalSelect } from "@/app/components/games/shared/ModalSelect";
import { TypeToConfirmDangerModal } from "@/app/components/shared/TypeToConfirmDangerModal";
import { CATALOGUE_EXPORT_DOMAIN_ORDER } from "@/app/lib/catalogueExportResolve";
import type { CatalogueExportDomain } from "@/app/lib/catalogueExportResolve";
import type {
  CatalogueSyncApplyResult,
  CatalogueSyncPreviewResponse,
} from "@/app/lib/catalogueSyncDiff";
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

async function postApply(
  source: CatalogueEnvironment,
  dest: CatalogueEnvironment
): Promise<CatalogueSyncApplyResult> {
  const res = await fetch("/api/staff/catalogue-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, dest }),
  });
  const body = (await res.json().catch(() => undefined)) as
    | (CatalogueSyncApplyResult & { message?: string })
    | undefined;
  if (!res.ok) {
    const fallback = "Failed to apply Catalogue sync.";
    const fromBody =
      typeof body?.message === "string" ? body.message : fallback;
    throw new Error(
      res.status >= 500
        ? getUserSafeErrorMessage(fromBody, fallback)
        : getUserSafeApiError(res.status, body, fallback)
    );
  }
  return body as CatalogueSyncApplyResult;
}

function overlayConfirmCopy(totals: {
  added: number;
  updated: number;
  blocked: number;
}): string {
  const applyCount = totals.added + totals.updated;
  const skipCount = totals.blocked;
  return `Apply ${applyCount} Official rows. Skip ${skipCount} blocked rows. Dest-only Official rows stay.`;
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] =
    useState<CatalogueSyncApplyResult | null>(null);

  const samePairing = source !== "" && dest !== "" && source === dest;
  const canPreview =
    source !== "" && dest !== "" && !samePairing && !isLoading && !isApplying;

  const sourceOptions = catalogueSync.sources.map((environment) => ({
    value: environment,
    label: environmentLabel(environment, catalogueSync.thisEnvironment),
  }));
  const destOptions = catalogueSync.destinations.map((environment) => ({
    value: environment,
    label: environmentLabel(environment, catalogueSync.thisEnvironment),
  }));

  const runPreview = async (options?: { keepResult?: boolean }) => {
    if (source === "" || dest === "" || source === dest) return;
    setIsLoading(true);
    setErrorMessage(null);
    setShowDetails(false);
    if (!options?.keepResult) setApplyResult(null);
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

  const runApply = async () => {
    if (source === "" || dest === "" || source === dest) return;
    setIsApplying(true);
    setConfirmError(null);
    try {
      const result = await postApply(source, dest);
      setApplyResult(result);
      setConfirmOpen(false);
      await runPreview({ keepResult: true });
    } catch (error) {
      setConfirmError(getUserSafeErrorMessage(error));
    } finally {
      setIsApplying(false);
    }
  };

  const totals = preview?.domains ? preview.totals : undefined;
  const confirmCopy = totals ? overlayConfirmCopy(totals) : "";
  const productionDest = dest === "production";
  const destinationName = dest === "" ? "" : CATALOGUE_ENVIRONMENT_LABELS[dest];
  const detailRows = preview?.domains
    ? CATALOGUE_EXPORT_DOMAIN_ORDER.flatMap((domain) =>
        (preview.domains?.[domain]?.rows ?? []).map((row) => ({
          ...row,
          domain,
        }))
      )
    : [];

  return (
    <>
      <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        title="Catalogue sync"
        titleId="catalogue-sync-title"
        subtitle="Overlay Official rows from a source Catalogue environment onto a destination. Apply writes dest only when this process is the destination."
        maxWidthClass="max-w-lg"
        closeDisabled={isApplying}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="modalFooterSecondary"
              fullWidth={false}
              onClick={onClose}
              disabled={isApplying}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="modalFooterPrimary"
              fullWidth={false}
              disabled={!preview?.applyEnabled || isLoading || isApplying}
              onClick={() => {
                setConfirmError(null);
                setConfirmOpen(true);
              }}
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
              setApplyResult(null);
              setConfirmOpen(false);
              setConfirmError(null);
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
              setApplyResult(null);
              setConfirmOpen(false);
              setConfirmError(null);
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
            {isLoading ? "Diffing…" : preview ? "Diff again" : "Diff"}
          </Button>
          {errorMessage ? (
            <p className="text-sm text-neblirDanger-400" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {preview && !preview.destIsThisEnvironment ? (
            <div className="space-y-2 text-sm text-white/90">
              <p>
                Diff and apply run only on the destination Catalogue
                environment. Apply is off here.
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
                  Open super-admin on{" "}
                  {CATALOGUE_ENVIRONMENT_LABELS[preview.dest]} with this pairing
                  to preview and apply.
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
                        {BUCKET_LABELS[row.bucket]} ·{" "}
                        {DOMAIN_LABELS[row.domain]}
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </div>
          ) : null}
          {applyResult ? (
            <div className="space-y-2 text-sm text-white">
              <p className="font-medium">Apply result</p>
              <p>
                Applied {applyResult.applied.length}, skipped{" "}
                {applyResult.skipped.length}, failed {applyResult.failed.length}
                .
              </p>
              {applyResult.applied.length > 0 ? (
                <ul className="space-y-1">
                  {applyResult.applied.map((row) => (
                    <li key={`applied-${row.domain}-${row.id}`}>
                      Applied {DOMAIN_LABELS[row.domain]} {row.id}
                    </li>
                  ))}
                </ul>
              ) : null}
              {applyResult.skipped.length > 0 ? (
                <ul className="space-y-1 text-white/80">
                  {applyResult.skipped.map((row) => (
                    <li key={`skipped-${row.domain}-${row.id}`}>
                      Skipped {DOMAIN_LABELS[row.domain]} {row.id} (blocked)
                    </li>
                  ))}
                </ul>
              ) : null}
              {applyResult.failed.length > 0 ? (
                <ul className="space-y-1 text-neblirDanger-400">
                  {applyResult.failed.map((row) => (
                    <li key={`failed-${row.domain}-${row.id}`}>
                      Failed {DOMAIN_LABELS[row.domain]} {row.id}: {row.message}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="text-white/80">
                Diff again reloads this pairing from live dest. Applied ids drop
                out. Rows that failed and still differ stay pending.
              </p>
            </div>
          ) : null}
        </div>
      </ModalShell>
      {productionDest ? (
        <TypeToConfirmDangerModal
          isOpen={confirmOpen}
          title={`Apply Official overlay onto ${destinationName}?`}
          description={confirmCopy}
          requiredPhrase={destinationName}
          confirmLabel="Apply overlay"
          confirmSubmittingLabel="Applying…"
          cancelLabel="Cancel"
          isSubmitting={isApplying}
          errorMessage={confirmError}
          variant="modalBackground"
          onCancel={() => {
            if (isApplying) return;
            setConfirmOpen(false);
            setConfirmError(null);
          }}
          onConfirm={() => {
            void runApply();
          }}
        />
      ) : (
        <DangerConfirmModal
          isOpen={confirmOpen}
          title="Apply Official overlay?"
          description={confirmCopy}
          confirmLabel="Apply overlay"
          confirmSubmittingLabel="Applying…"
          cancelLabel="Cancel"
          isSubmitting={isApplying}
          errorMessage={confirmError}
          variant="modalBackground"
          onCancel={() => {
            if (isApplying) return;
            setConfirmOpen(false);
            setConfirmError(null);
          }}
          onConfirm={() => {
            void runApply();
          }}
        />
      )}
    </>
  );
}
