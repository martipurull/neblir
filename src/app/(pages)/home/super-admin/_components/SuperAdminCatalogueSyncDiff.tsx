import { Button } from "@/app/components/shared/Button";
import {
  appButtonVariantClassName,
  linkAsModalActionBlockClassName,
} from "@/app/components/shared/buttonStyles";
import { CATALOGUE_EXPORT_DOMAIN_ORDER } from "@/app/lib/catalogueExportResolve";
import type { CatalogueSyncPreviewResponse } from "@/app/lib/catalogueSyncDiff";
import { CATALOGUE_ENVIRONMENT_LABELS } from "@/app/lib/catalogueSyncEnv";
import {
  CATALOGUE_SYNC_BUCKET_LABELS,
  CATALOGUE_SYNC_DOMAIN_LABELS,
} from "./catalogueSyncLabels";

export function SuperAdminCatalogueSyncDiff({
  preview,
  showDetails,
  onToggleDetails,
}: {
  preview: CatalogueSyncPreviewResponse;
  showDetails: boolean;
  onToggleDetails: () => void;
}) {
  if (!preview.destIsThisEnvironment) {
    return (
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
    );
  }

  const totals = preview.totals;
  if (!totals || !preview.domains) return null;

  const detailRows = CATALOGUE_EXPORT_DOMAIN_ORDER.flatMap((domain) =>
    (preview.domains?.[domain]?.rows ?? []).map((row) => ({
      ...row,
      domain,
    }))
  );

  return (
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
              {CATALOGUE_SYNC_DOMAIN_LABELS[domain]}: added {counts.added},
              updated {counts.updated}, dest-only {counts.destOnly}, blocked{" "}
              {counts.blocked}
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        variant="modalFooterSecondary"
        fullWidth={false}
        onClick={onToggleDetails}
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
                {CATALOGUE_SYNC_BUCKET_LABELS[row.bucket]} ·{" "}
                {CATALOGUE_SYNC_DOMAIN_LABELS[row.domain]}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
