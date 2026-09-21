"use client";

import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import type {
  CatalogueEnvironment,
  CatalogueSyncHubConfig,
} from "@/app/lib/catalogueSyncEnv";
import {
  isPullableCatalogueSource,
  parseCatalogueEnvironmentParam,
} from "@/app/lib/catalogueSyncEnv";
import { useState } from "react";
import { SuperAdminCatalogueSyncModal } from "./SuperAdminCatalogueSyncModal";

function defaultSource(
  thisEnvironment: CatalogueEnvironment | null
): CatalogueEnvironment | "" {
  if (thisEnvironment && isPullableCatalogueSource(thisEnvironment)) {
    return thisEnvironment;
  }
  return "";
}

export function SuperAdminCatalogueSyncCard({
  catalogueSync,
  initialSource,
  initialDest,
}: {
  catalogueSync: CatalogueSyncHubConfig;
  initialSource?: string;
  initialDest?: string;
}) {
  const pairingFromUrl = (() => {
    const source = parseCatalogueEnvironmentParam(initialSource ?? null);
    const dest = parseCatalogueEnvironmentParam(initialDest ?? null);
    if (!source || !dest) return null;
    if (!isPullableCatalogueSource(source)) return null;
    if (!catalogueSync.destinations.includes(dest)) return null;
    return { source, dest };
  })();

  const [isOpen, setIsOpen] = useState(pairingFromUrl != null);
  const [useUrlPairing, setUseUrlPairing] = useState(pairingFromUrl != null);

  const sourceForModal =
    useUrlPairing && pairingFromUrl
      ? pairingFromUrl.source
      : defaultSource(catalogueSync.thisEnvironment);
  const destForModal =
    useUrlPairing && pairingFromUrl ? pairingFromUrl.dest : "";

  return (
    <>
      <InfoCard className="mt-4">
        <p className="text-sm font-semibold text-black">Catalogue sync</p>
        <p className="mt-2 text-sm text-black/80">
          Overlay Official catalogue rows from a source Catalogue environment
          onto a destination. Diff and apply on dest; git seed-export stays the
          human export door.
        </p>
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            fullWidth={false}
            onClick={() => {
              setUseUrlPairing(false);
              setIsOpen(true);
            }}
          >
            Catalogue sync
          </Button>
        </div>
      </InfoCard>
      <SuperAdminCatalogueSyncModal
        key={
          isOpen ? (useUrlPairing ? "url-pairing" : "manual-pairing") : "closed"
        }
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        catalogueSync={catalogueSync}
        initialSource={sourceForModal}
        initialDest={destForModal}
      />
    </>
  );
}
