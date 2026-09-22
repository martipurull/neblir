import type { CatalogueSyncApplyResult } from "@/app/lib/catalogueSyncApply";
import { CATALOGUE_SYNC_DOMAIN_LABELS } from "./catalogueSyncLabels";

export function SuperAdminCatalogueSyncApplyResult({
  result,
}: {
  result: CatalogueSyncApplyResult;
}) {
  return (
    <div className="space-y-2 text-sm text-white">
      <p className="font-medium">Apply result</p>
      <p>
        Applied {result.applied.length}, skipped {result.skipped.length}, failed{" "}
        {result.failed.length}.
      </p>
      {result.applied.length > 0 ? (
        <ul className="space-y-1">
          {result.applied.map((row) => (
            <li key={`applied-${row.domain}-${row.id}`}>
              {row.action === "delete" ? "Deleted" : "Applied"}{" "}
              {CATALOGUE_SYNC_DOMAIN_LABELS[row.domain]} {row.id}
            </li>
          ))}
        </ul>
      ) : null}
      {result.skipped.length > 0 ? (
        <ul className="space-y-1 text-white/80">
          {result.skipped.map((row) => (
            <li key={`skipped-${row.domain}-${row.id}`}>
              Skipped {CATALOGUE_SYNC_DOMAIN_LABELS[row.domain]} {row.id}{" "}
              (blocked)
            </li>
          ))}
        </ul>
      ) : null}
      {result.failed.length > 0 ? (
        <ul className="space-y-1 text-neblirDanger-400">
          {result.failed.map((row) => (
            <li key={`failed-${row.domain}-${row.id}`}>
              Failed {CATALOGUE_SYNC_DOMAIN_LABELS[row.domain]} {row.id}:{" "}
              {row.message}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-white/80">
        Diff again reloads this pairing from live dest. Applied ids drop out.
        Rows that failed and still differ stay pending.
      </p>
    </div>
  );
}
