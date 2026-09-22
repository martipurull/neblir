"use client";

import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { ModalSelect } from "@/app/components/games/shared/ModalSelect";
import type { CatalogueSyncApplyResult } from "@/app/lib/catalogueSyncApply";
import type {
  CatalogueSyncDestOnlyDeleteCounts,
  CatalogueSyncPreviewResponse,
} from "@/app/lib/catalogueSyncDiff";
import type {
  CatalogueEnvironment,
  CatalogueSyncHubConfig,
} from "@/app/lib/catalogueSyncEnv";
import { CATALOGUE_ENVIRONMENT_LABELS } from "@/app/lib/catalogueSyncEnv";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useState } from "react";
import { SuperAdminCatalogueSyncApplyResult } from "./SuperAdminCatalogueSyncApplyResult";
import { SuperAdminCatalogueSyncConfirm } from "./SuperAdminCatalogueSyncConfirm";
import { SuperAdminCatalogueSyncDiff } from "./SuperAdminCatalogueSyncDiff";
import {
  fetchCatalogueSyncPreview,
  postCatalogueSyncApply,
} from "./catalogueSyncRequests";

function environmentLabel(
  environment: CatalogueEnvironment,
  thisEnvironment: CatalogueEnvironment | null
): string {
  const label = CATALOGUE_ENVIRONMENT_LABELS[environment];
  return environment === thisEnvironment ? `${label} (this process)` : label;
}

function overlayConfirmCopy(
  totals: {
    added: number;
    updated: number;
    blocked: number;
  },
  destOnlyDelete?: CatalogueSyncDestOnlyDeleteCounts
): string {
  const applyCount = totals.added + totals.updated;
  if (!destOnlyDelete) {
    return `Apply ${applyCount} Official rows. Skip ${totals.blocked} blocked rows. Dest-only Official rows stay.`;
  }
  const collisionSkip = totals.blocked - destOnlyDelete.inUse;
  return `Apply ${applyCount} Official rows. Delete ${destOnlyDelete.unused} unused dest-only Official rows. Skip ${destOnlyDelete.inUse} in-use dest-only rows. Skip ${collisionSkip} blocked rows.`;
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
  const [deleteDestOnly, setDeleteDestOnly] = useState(false);

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

  const clearPairing = () => {
    setPreview(null);
    setErrorMessage(null);
    setShowDetails(false);
    setApplyResult(null);
    setConfirmOpen(false);
    setConfirmError(null);
    setDeleteDestOnly(false);
  };

  const runPreview = async (options?: {
    keepResult?: boolean;
    deleteDestOnly?: boolean;
  }) => {
    if (source === "" || dest === "" || source === dest) return;
    const optIn = options?.deleteDestOnly ?? deleteDestOnly;
    setIsLoading(true);
    setErrorMessage(null);
    setShowDetails(false);
    if (!options?.keepResult) setApplyResult(null);
    try {
      const result = await fetchCatalogueSyncPreview(source, dest, {
        deleteDestOnly: optIn,
      });
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
      const result = await postCatalogueSyncApply(source, dest, {
        deleteDestOnly,
      });
      setApplyResult(result);
      setConfirmOpen(false);
      await runPreview({ keepResult: true });
    } catch (error) {
      setConfirmError(getUserSafeErrorMessage(error));
    } finally {
      setIsApplying(false);
    }
  };

  const cancelConfirm = () => {
    if (isApplying) return;
    setConfirmOpen(false);
    setConfirmError(null);
  };

  const totals = preview?.domains ? preview.totals : undefined;
  const confirmCopy = totals
    ? overlayConfirmCopy(
        totals,
        deleteDestOnly ? preview?.destOnlyDelete : undefined
      )
    : "";
  const destinationName = dest === "" ? "" : CATALOGUE_ENVIRONMENT_LABELS[dest];

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
              clearPairing();
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
              clearPairing();
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
          {preview ? (
            <SuperAdminCatalogueSyncDiff
              preview={preview}
              showDetails={showDetails}
              onToggleDetails={() => setShowDetails((open) => !open)}
            />
          ) : null}
          {preview?.destIsThisEnvironment ? (
            <Checkbox
              tone="inverse"
              checked={deleteDestOnly}
              disabled={isLoading || isApplying}
              onChange={(checked) => {
                setDeleteDestOnly(checked);
                void runPreview({
                  keepResult: true,
                  deleteDestOnly: checked,
                });
              }}
              label="Delete unused dest-only Official rows"
            />
          ) : null}
          {applyResult ? (
            <SuperAdminCatalogueSyncApplyResult result={applyResult} />
          ) : null}
        </div>
      </ModalShell>
      <SuperAdminCatalogueSyncConfirm
        productionDest={dest === "production"}
        destinationName={destinationName}
        confirmCopy={confirmCopy}
        isOpen={confirmOpen}
        isApplying={isApplying}
        errorMessage={confirmError}
        onCancel={cancelConfirm}
        onConfirm={() => {
          void runApply();
        }}
      />
    </>
  );
}
