"use client";

import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import {
  CATALOGUE_EXPORT_DOMAIN_ORDER,
  CATALOGUE_SEED_FILENAMES,
} from "@/app/lib/catalogueExportResolve";
import { useState } from "react";
import { downloadCatalogueSeedFromApi } from "../_utils/catalogueJsonDownload";

type SuperAdminCatalogueSeedExportCardProps = {
  touchedDomains: string[] | undefined;
};

export function SuperAdminCatalogueSeedExportCard({
  touchedDomains,
}: SuperAdminCatalogueSeedExportCardProps) {
  const [exportError, setExportError] = useState<string | null>(null);
  const touched = new Set(touchedDomains ?? []);

  const runDownload = (task: () => Promise<void>) => {
    setExportError(null);
    void task().catch((e) =>
      setExportError(e instanceof Error ? e.message : "Export failed")
    );
  };

  return (
    <InfoCard className="mt-4">
      <p className="text-sm font-semibold text-black">
        Bulk export for seed files
      </p>
      <p className="mt-2 text-sm text-black/80">
        Each catalogue-domain download is a JSON array of{" "}
        <strong>all current Official rows</strong> in that domain, named like
        the git seed file (for example{" "}
        <code className="rounded bg-black/5 px-1">Item_Upload.json</code>).{" "}
        <strong>Download all domains</strong> is a zip of all seven seed files.
        Downloading does not clear the drift banner — use{" "}
        <strong>I have updated the repo seeds</strong> after git is updated.
      </p>
      {exportError ? (
        <p className="mt-2 text-sm text-neblirDanger-600" role="alert">
          {exportError}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {CATALOGUE_EXPORT_DOMAIN_ORDER.map((domain) => {
          const filename = CATALOGUE_SEED_FILENAMES[domain];
          return (
            <Button
              key={domain}
              type="button"
              variant="semanticSafeOutline"
              fullWidth={false}
              disabled={!touched.has(domain)}
              onClick={() =>
                runDownload(() =>
                  downloadCatalogueSeedFromApi({
                    scope: "all",
                    format: "array",
                    domains: domain,
                  })
                )
              }
            >
              Download {filename}
            </Button>
          );
        })}
        <Button
          type="button"
          variant="secondary"
          fullWidth={false}
          onClick={() =>
            runDownload(() =>
              downloadCatalogueSeedFromApi({
                scope: "all",
                format: "zip",
              })
            )
          }
        >
          Download all domains
        </Button>
      </div>
    </InfoCard>
  );
}
