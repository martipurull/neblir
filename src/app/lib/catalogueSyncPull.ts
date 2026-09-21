import { CATALOGUE_EXPORT_DOMAIN_ORDER } from "@/app/lib/catalogueExportResolve";
import type { CatalogueExportDomain } from "@/app/lib/catalogueExportResolve";

export type CatalogueSyncSnapshotData = Record<
  CatalogueExportDomain,
  unknown[]
>;

export type CatalogueSyncSnapshot = {
  scope: "all";
  domains: CatalogueExportDomain[];
  data: CatalogueSyncSnapshotData;
};

export class CatalogueSyncPullError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "CatalogueSyncPullError";
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSnapshotBody(body: unknown): CatalogueSyncSnapshot {
  if (!isObject(body)) {
    throw new CatalogueSyncPullError(
      "Source snapshot was not a JSON object.",
      502
    );
  }
  if (body.scope !== "all") {
    throw new CatalogueSyncPullError(
      "Source snapshot is not seed-export scope=all.",
      502
    );
  }
  if (!isObject(body.data)) {
    throw new CatalogueSyncPullError(
      "Source snapshot is missing Official catalogue data.",
      502
    );
  }
  const data = {} as CatalogueSyncSnapshotData;
  for (const domain of CATALOGUE_EXPORT_DOMAIN_ORDER) {
    const rows = body.data[domain];
    if (!Array.isArray(rows)) {
      throw new CatalogueSyncPullError(
        `Source snapshot is missing Official ${domain} rows.`,
        502
      );
    }
    data[domain] = rows;
  }
  return {
    scope: "all",
    domains: [...CATALOGUE_EXPORT_DOMAIN_ORDER],
    data,
  };
}

export async function pullCatalogueSyncSnapshot(input: {
  sourceBaseUrl: string;
  pullSecret: string;
}): Promise<CatalogueSyncSnapshot> {
  const url = `${input.sourceBaseUrl}/api/catalogue-sync/snapshot`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.pullSecret}`,
        Accept: "application/json",
      },
    });
  } catch {
    throw new CatalogueSyncPullError(
      "Failed to pull the source Official snapshot.",
      502
    );
  }
  if (!response.ok) {
    throw new CatalogueSyncPullError(
      `Failed to pull the source Official snapshot (${response.status}).`,
      502
    );
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CatalogueSyncPullError(
      "Source snapshot was not valid JSON.",
      502
    );
  }
  return parseSnapshotBody(body);
}
