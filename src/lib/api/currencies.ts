import {
  catalogueCurrencyListSchema,
  currencyListResponseSchema,
  currencyResponseSchema,
  type CatalogueCurrency,
  type CurrencyResponse,
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

export async function getCurrencies(): Promise<CurrencyResponse[]> {
  const response = await fetch("/api/currencies");
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

  const parsed = currencyListResponseSchema.safeParse(await response.json());
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

export async function getCurrency(id: string): Promise<CurrencyResponse> {
  const response = await fetch(`/api/currencies/${encodeURIComponent(id)}`);
  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(response.status, body, "Failed to load currency")
    );
  }

  const parsed = currencyResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Currency response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}
