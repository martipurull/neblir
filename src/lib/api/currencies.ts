import {
  catalogueCurrencyListSchema,
  type CatalogueCurrency,
} from "@/app/lib/types/currency";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

export async function fetchCatalogueCurrencies(
  url: string
): Promise<CatalogueCurrency[]> {
  const response = await fetch(url);
  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(response.status, body, "Failed to load currencies")
    );
  }

  const json: unknown = await response.json();
  const parsed = catalogueCurrencyListSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Currencies response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}
