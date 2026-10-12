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

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_SNAPSHOT_REDIRECTS = 5;

function failedSourceSnapshot(status: number): CatalogueSyncPullError {
  return new CatalogueSyncPullError(
    `Failed to pull the source Official snapshot (${status}).`,
    502
  );
}

function snapshotRequestInit(pullSecret: string): RequestInit {
  return {
    method: "GET",
    redirect: "manual",
    headers: {
      Authorization: `Bearer ${pullSecret}`,
      Accept: "application/json",
    },
  };
}

/** Same host, or the apex ↔ www hop that would otherwise drop Authorization. */
function mayReplayPullSecret(from: URL, to: URL): boolean {
  if (to.protocol !== "https:" && to.protocol !== "http:") return false;
  if (from.origin === to.origin) return true;
  const fromHost = from.hostname.toLowerCase();
  const toHost = to.hostname.toLowerCase();
  return toHost === `www.${fromHost}` || fromHost === `www.${toHost}`;
}

function redirectTarget(currentUrl: string, response: Response): string {
  const location = response.headers.get("location");
  if (!location) throw failedSourceSnapshot(response.status);
  let next: URL;
  try {
    next = new URL(location, currentUrl);
  } catch {
    throw failedSourceSnapshot(response.status);
  }
  if (!mayReplayPullSecret(new URL(currentUrl), next)) {
    throw failedSourceSnapshot(response.status);
  }
  return next.toString();
}

async function fetchCatalogueSnapshot(
  startUrl: string,
  pullSecret: string
): Promise<Response> {
  let currentUrl = startUrl;
  for (let followed = 0; ; followed++) {
    const response = await fetch(currentUrl, snapshotRequestInit(pullSecret));
    if (!REDIRECT_STATUSES.has(response.status)) return response;
    if (followed === MAX_SNAPSHOT_REDIRECTS) {
      throw failedSourceSnapshot(response.status);
    }
    currentUrl = redirectTarget(currentUrl, response);
  }
}

export async function pullCatalogueSyncSnapshot(input: {
  sourceBaseUrl: string;
  pullSecret: string;
}): Promise<CatalogueSyncSnapshot> {
  const url = `${input.sourceBaseUrl}/api/catalogue-sync/snapshot`;
  let response: Response;
  try {
    response = await fetchCatalogueSnapshot(url, input.pullSecret);
  } catch (error) {
    if (error instanceof CatalogueSyncPullError) throw error;
    throw new CatalogueSyncPullError(
      "Failed to pull the source Official snapshot.",
      502
    );
  }
  if (!response.ok) throw failedSourceSnapshot(response.status);
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
