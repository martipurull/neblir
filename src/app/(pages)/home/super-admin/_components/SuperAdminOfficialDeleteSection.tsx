"use client";

import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import {
  TypeToConfirmDangerModal,
  getDeleteOfficialCatalogueConfirmationPhrase,
} from "@/app/components/shared/TypeToConfirmDangerModal";
import {
  officialCatalogueUsageIsUnused,
  type OfficialCatalogueUsageBreakdown,
  type OfficialCatalogueUsageDomain,
} from "@/app/lib/officialCatalogueUsage";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

const USAGE_LINE_ORDER: {
  key: keyof OfficialCatalogueUsageBreakdown;
  label: string;
}[] = [
  { key: "characters", label: "Characters holding this" },
  { key: "uniqueItems", label: "Unique items from this" },
  { key: "uniqueVehicles", label: "Unique vehicles from this" },
  { key: "enemyInstances", label: "Enemy instances" },
  { key: "favouriteWeaponRows", label: "Favourite-weapon rows" },
  { key: "featureGrants", label: "Feature grants" },
];

function UsageDescription({
  breakdown,
}: {
  breakdown: OfficialCatalogueUsageBreakdown | null;
}) {
  if (!breakdown || officialCatalogueUsageIsUnused(breakdown)) {
    return <p>This row is not used in play.</p>;
  }

  const lines = USAGE_LINE_ORDER.filter(({ key }) => breakdown[key] > 0);
  return (
    <div className="space-y-2">
      <p>This Official row is used in play:</p>
      <ul className="list-disc pl-5">
        {lines.map(({ key, label }) => (
          <li key={key}>
            {label}: {breakdown[key]}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SuperAdminOfficialDeleteSection({
  catalogueDomain,
  rowId,
  rowName,
  deleteUrl,
  successHref,
  entityLabel,
  disabled = false,
}: {
  catalogueDomain: OfficialCatalogueUsageDomain;
  rowId: string;
  rowName: string;
  deleteUrl: string;
  successHref: string;
  entityLabel: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [usage, setUsage] = useState<OfficialCatalogueUsageBreakdown | null>(
    null
  );
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openConfirm = useCallback(async () => {
    setErrorMessage(null);
    setLoadingUsage(true);
    try {
      const res = await fetch(
        `/api/staff/catalogue-usage?domain=${encodeURIComponent(catalogueDomain)}&id=${encodeURIComponent(rowId)}`
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(
          typeof body?.message === "string"
            ? body.message
            : `Could not load usage (${res.status})`
        );
        return;
      }
      setUsage(body as OfficialCatalogueUsageBreakdown);
      setConfirmOpen(true);
    } finally {
      setLoadingUsage(false);
    }
  }, [catalogueDomain, rowId]);

  const handleDelete = useCallback(async () => {
    setErrorMessage(null);
    setDeleting(true);
    try {
      const res = await fetch(deleteUrl, { method: "DELETE" });
      if (res.status === 204) {
        router.push(successHref);
        return;
      }
      const body = await res.json().catch(() => ({}));
      setErrorMessage(
        typeof body?.message === "string"
          ? body.message
          : `Delete failed (${res.status})`
      );
    } finally {
      setDeleting(false);
    }
  }, [deleteUrl, router, successHref]);

  const busy = disabled || loadingUsage || deleting;
  const confirmLabel = `Delete ${entityLabel}`;

  return (
    <div className="flex flex-col gap-2 sm:items-start">
      <Button
        type="button"
        variant="danger"
        disabled={busy}
        onClick={() => {
          void openConfirm();
        }}
      >
        {loadingUsage
          ? "Checking usage…"
          : deleting
            ? "Deleting…"
            : confirmLabel}
      </Button>
      {errorMessage && !confirmOpen ? (
        <InfoCard className="border-neblirDanger bg-paleBlue/20">
          <p className="text-sm text-black">{errorMessage}</p>
        </InfoCard>
      ) : null}
      <TypeToConfirmDangerModal
        isOpen={confirmOpen}
        title={`Delete this Official ${entityLabel} from the catalogue?`}
        description={<UsageDescription breakdown={usage} />}
        requiredPhrase={getDeleteOfficialCatalogueConfirmationPhrase(rowName)}
        confirmLabel={confirmLabel}
        cancelLabel="Cancel"
        isSubmitting={deleting}
        errorMessage={errorMessage}
        onCancel={() => {
          if (deleting) return;
          setConfirmOpen(false);
        }}
        onConfirm={() => {
          void handleDelete();
        }}
      />
    </div>
  );
}
