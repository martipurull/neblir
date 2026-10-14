type CurrencySeedRow = {
  id?: string;
  name: string;
  exchangeValue: number;
  imageKey: string;
};

function isPositiveWholeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function readTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseCurrencySeedJson(raw: string): CurrencySeedRow[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Currency seed JSON root must be an array.");
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Currency seed row ${index + 1} must be an object.`);
    }
    const row = entry as Record<string, unknown>;
    const name = readTrimmedString(row.name);
    const imageKey = readTrimmedString(row.imageKey);
    const label = name || `row ${index + 1}`;
    if (!name) {
      throw new Error(`Currency seed row ${index + 1} is missing a name.`);
    }
    if (!imageKey) {
      throw new Error(`Currency "${label}" is missing an image key.`);
    }
    if (!isPositiveWholeNumber(row.exchangeValue)) {
      throw new Error(
        `Currency "${label}": exchange value is missing or not a positive whole number.`
      );
    }
    const id = readTrimmedString(row.id);
    return {
      ...(id ? { id } : {}),
      name,
      exchangeValue: row.exchangeValue,
      imageKey,
    };
  });
}
