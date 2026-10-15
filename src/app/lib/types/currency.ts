import { normalizeOfficialName } from "@/app/lib/officialName";
import { z } from "zod";

export const CONF_CURRENCY_NAME = "CONF";
export const CONF_EXCHANGE_VALUE = 100;
export const CONF_CURRENCY_LOCK_MESSAGE =
  "CONF's name and exchange value cannot be changed";

export function isConfCurrency(name: string): boolean {
  return (
    normalizeOfficialName(name) === normalizeOfficialName(CONF_CURRENCY_NAME)
  );
}

const currencyNameSchema = z.string().trim().min(1);
const currencyImageKeySchema = z.string().trim().min(1);
const exchangeValueSchema = z.number().int().min(1);

export const currencyCreateSchema = z
  .object({
    name: currencyNameSchema,
    exchangeValue: exchangeValueSchema,
    imageKey: currencyImageKeySchema,
  })
  .strict();

export const currencyUpdateSchema = z
  .object({
    name: currencyNameSchema.optional(),
    exchangeValue: exchangeValueSchema.optional(),
    imageKey: currencyImageKeySchema.optional(),
  })
  .strict();

/** Catalogue row a player sees: id, name, and image. Extra fields such as exchange value are omitted. */
const catalogueCurrencySchema = z.object({
  id: z.string().min(1),
  name: currencyNameSchema,
  imageKey: currencyImageKeySchema,
});

export const catalogueCurrencyListSchema = z.array(catalogueCurrencySchema);

export type CatalogueCurrency = z.infer<typeof catalogueCurrencySchema>;

type ConfCurrencySnapshot = {
  name: string;
  exchangeValue: number;
};

/** True when this write would change CONF's name or exchange value, or would store CONF under another spelling or value. */
export function confCurrencyWriteIsLocked(input: {
  existing: ConfCurrencySnapshot | null;
  name?: string;
  exchangeValue?: number;
}): boolean {
  const existingIsConf = input.existing
    ? isConfCurrency(input.existing.name)
    : false;

  if (existingIsConf) {
    if (input.name !== undefined && input.name !== CONF_CURRENCY_NAME) {
      return true;
    }
    if (
      input.exchangeValue !== undefined &&
      input.exchangeValue !== CONF_EXCHANGE_VALUE
    ) {
      return true;
    }
    return false;
  }

  const nextName = input.name ?? input.existing?.name;
  const nextExchange = input.exchangeValue ?? input.existing?.exchangeValue;
  if (nextName === undefined || nextExchange === undefined) return false;
  if (!isConfCurrency(nextName)) return false;
  return (
    nextName !== CONF_CURRENCY_NAME || nextExchange !== CONF_EXCHANGE_VALUE
  );
}
