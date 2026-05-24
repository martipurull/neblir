"use client";

import { Button } from "@/app/components/shared/Button";
import { downloadJsonFile } from "../_utils/catalogueJsonDownload";

type SuperAdminSeedJsonDownloadButtonProps = {
  /** Latest API response body after a successful create. */
  record: unknown | null;
  /** File prefix, e.g. `item` → `item-<timestamp>.json` */
  filenamePrefix: string;
};

export function SuperAdminSeedJsonDownloadButton({
  record,
  filenamePrefix,
}: SuperAdminSeedJsonDownloadButtonProps) {
  if (!record) return null;
  return (
    <div className="mt-3">
      <Button
        type="button"
        variant="semanticSafeOutline"
        fullWidth={false}
        onClick={() => {
          const stamp = new Date().toISOString().replace(/[:.]/g, "-");
          downloadJsonFile(`${filenamePrefix}-${stamp}.json`, record);
        }}
      >
        Download JSON for this record
      </Button>
      <p className="mt-2 text-xs text-black/60">
        Omits import-only flags (e.g.{" "}
        <code className="rounded bg-black/5 px-1">
          protectedFromOfficialImport
        </code>
        ). Merge into the matching file under{" "}
        <code className="rounded bg-black/5 px-1">prisma/data</code> as needed.
      </p>
    </div>
  );
}
