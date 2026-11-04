import {
  catalogueCurrencyListSchema,
  currencyListResponseSchema,
  currencyResponseSchema,
  type CatalogueCurrency,
  type CurrencyResponse,
} from "@/app/lib/types/currency";
import { readApiErrorBody, responseShapeError } from "@/lib/api/responseShape";
import { getUserSafeApiError } from "@/lib/userSafeError";

export async function fetchCatalogueCurrencies(
  url: string
): Promise<CatalogueCurrency[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to load currencies"
      )
    );
  }

  const json: unknown = await response.json();
  const parsed = catalogueCurrencyListSchema.safeParse(json);
  if (!parsed.success) {
    throw responseShapeError("Currencies", parsed.error);
  }
  return parsed.data;
}

export async function getCurrencies(): Promise<CurrencyResponse[]> {
  const response = await fetch("/api/currencies");
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to load currencies"
      )
    );
  }

  const parsed = currencyListResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Currencies", parsed.error);
  }
  return parsed.data;
}

export async function getCurrency(id: string): Promise<CurrencyResponse> {
  const response = await fetch(`/api/currencies/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to load currency"
      )
    );
  }

  const parsed = currencyResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Currency", parsed.error);
  }
  return parsed.data;
}
