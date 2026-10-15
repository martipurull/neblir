type CatalogueCurrency = {
  id: string;
  name: string;
  imageKey: string;
};

/** Reads id, name, and image. Drops exchange value and any other field. */
function parseCatalogueCurrencies(json: unknown): CatalogueCurrency[] {
  if (!Array.isArray(json)) return [];
  const currencies: CatalogueCurrency[] = [];
  for (const row of json) {
    if (!row || typeof row !== "object") continue;
    const candidate = row as {
      id?: unknown;
      name?: unknown;
      imageKey?: unknown;
    };
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.name !== "string" ||
      typeof candidate.imageKey !== "string"
    ) {
      continue;
    }
    currencies.push({
      id: candidate.id,
      name: candidate.name,
      imageKey: candidate.imageKey,
    });
  }
  return currencies;
}

export async function fetchCatalogueCurrencies(
  url: string
): Promise<CatalogueCurrency[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load currencies");
  }
  return parseCatalogueCurrencies(await response.json());
}
