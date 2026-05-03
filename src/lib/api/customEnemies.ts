type ApiErrorPayload = { message?: string; details?: string };

function triggerCsvDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadGameCustomEnemiesCsv(
  gameId: string
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-enemies/export`,
    { method: "GET" }
  );
  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(body?.message ?? `Export failed (${response.status})`);
  }
  const blob = await response.blob();
  const cd = response.headers.get("Content-Disposition");
  const match = cd?.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? `custom-enemies-${gameId}.csv`;
  triggerCsvDownload(blob, filename);
}

export async function downloadCustomEnemyCsv(
  gameId: string,
  customEnemyId: string
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-enemies/${encodeURIComponent(customEnemyId)}/export`,
    { method: "GET" }
  );
  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(body?.message ?? `Export failed (${response.status})`);
  }
  const blob = await response.blob();
  const cd = response.headers.get("Content-Disposition");
  const match = cd?.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? `custom-enemy-${customEnemyId}.csv`;
  triggerCsvDownload(blob, filename);
}

export type ImportCustomEnemiesResult = {
  created: number;
  skipped: number;
  rowErrors: Array<{ line: number; message: string }>;
};

export async function importCustomEnemiesCsv(
  gameId: string,
  file: File
): Promise<ImportCustomEnemiesResult> {
  const form = new FormData();
  form.set("file", file);
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-enemies/import`,
    {
      method: "POST",
      body: form,
    }
  );
  const json = (await response
    .json()
    .catch(() => ({}))) as ImportCustomEnemiesResult & ApiErrorPayload;
  if (!response.ok) {
    throw new Error(json.message ?? `Import failed (${response.status})`);
  }
  return json;
}

export async function copyCustomEnemyToGame(
  targetGameId: string,
  sourceGameId: string,
  sourceCustomEnemyId: string
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(targetGameId)}/custom-enemies/copy`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceGameId, sourceCustomEnemyId }),
    }
  );
  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(body?.message ?? `Copy failed (${response.status})`);
  }
}

export async function deleteCustomEnemy(
  gameId: string,
  customEnemyId: string
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-enemies/${encodeURIComponent(customEnemyId)}`,
    { method: "DELETE" }
  );
  if (!response.ok && response.status !== 204) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(body?.message ?? `Delete failed (${response.status})`);
  }
}
