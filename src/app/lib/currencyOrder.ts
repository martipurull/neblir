import { CONF_CURRENCY_NAME } from "@/app/lib/types/currency";

/** CONF first, then every other row by stored name, compared as code units. */
export function orderConfFirstThenByName<T extends { name: string }>(
  rows: readonly T[]
): T[] {
  return [...rows].sort((a, b) => {
    const aIsConf = a.name === CONF_CURRENCY_NAME;
    const bIsConf = b.name === CONF_CURRENCY_NAME;
    if (aIsConf !== bIsConf) return aIsConf ? -1 : 1;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
}
