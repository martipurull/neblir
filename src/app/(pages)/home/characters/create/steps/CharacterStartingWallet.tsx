"use client";

import { WalletCurrencyIcon } from "@/app/components/character/WalletCurrencyIcon";
import { NumberField } from "@/app/components/shared/NumberField";
import { coerceNumericFieldValue } from "@/app/components/shared/bumpNumericFieldValue";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { orderConfFirstThenByName } from "@/app/lib/currencyOrder";
import { fetchCatalogueCurrencies } from "@/lib/api/currencies";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import useSWR from "swr";

export function CharacterStartingWallet() {
  const { control } = useFormContext<CharacterCreationRequest>();
  const { data, error, isLoading } = useSWR(
    "/api/currencies",
    fetchCatalogueCurrencies
  );
  const currencies = useMemo(
    () => orderConfFirstThenByName(data ?? []),
    [data]
  );
  const imageEntries = useMemo(
    () =>
      currencies.map((currency) => ({
        id: currency.id,
        imageKey: currency.imageKey,
      })),
    [currencies]
  );
  const imageUrls = useImageUrls(imageEntries);

  return (
    <div className="mb-6 sm:col-span-2 lg:col-span-3">
      <p className="mb-2 block font-bold text-black">Money (wallet)</p>
      <p className="mb-2 text-xs text-black/70">
        Disposable income you think your character would have access to. Set an
        amount for any currency.
      </p>
      <Controller
        name="wallet"
        control={control}
        defaultValue={[]}
        render={({ field }) => {
          const wallet = field.value ?? [];
          const updateQuantity = (currencyName: string, quantity: number) => {
            const existing = wallet.some(
              (entry) => entry.currencyName === currencyName
            );
            field.onChange(
              existing
                ? wallet.map((entry) =>
                    entry.currencyName === currencyName
                      ? { ...entry, quantity }
                      : entry
                  )
                : [...wallet, { currencyName, quantity }]
            );
          };

          if (isLoading) {
            return (
              <p className="text-sm text-black/70">Loading currencies...</p>
            );
          }
          if (error) {
            return (
              <p className="text-sm text-neblirDanger">
                Could not load currencies.
              </p>
            );
          }
          if (currencies.length === 0) {
            return <p className="text-sm text-black/70">No currencies.</p>;
          }

          return (
            <div className="space-y-2 rounded-md border border-black/20 bg-black/5 p-3">
              {currencies.map((currency) => {
                const quantity =
                  wallet.find((entry) => entry.currencyName === currency.name)
                    ?.quantity ?? 0;
                const imageUrl = imageUrls[currency.id];
                return (
                  <div
                    key={currency.id}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <span className="inline-flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs">
                      <WalletCurrencyIcon
                        name={currency.name}
                        imageKey={currency.imageKey}
                        imageUrl={imageUrl}
                        size="sm"
                      />
                      <span className="truncate text-sm font-medium text-black">
                        {currency.name}
                      </span>
                    </span>
                    <NumberField
                      id={`wallet-qty-${currency.id}`}
                      min={0}
                      value={quantity}
                      stepperLabel={`${currency.name} quantity`}
                      onChange={(raw) =>
                        updateQuantity(
                          currency.name,
                          coerceNumericFieldValue(raw, "int", 0)
                        )
                      }
                      className="ml-auto !w-24 shrink-0 !min-h-9"
                      inputClassName="px-2 py-1 text-right text-sm"
                    />
                  </div>
                );
              })}
            </div>
          );
        }}
      />
    </div>
  );
}
