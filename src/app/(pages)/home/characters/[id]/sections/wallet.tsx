"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import {
  WalletAdjustModal,
  type WalletAdjustMode,
} from "@/app/components/character/WalletAdjustModal";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { Button } from "@/app/components/shared/Button";
import { addWalletCurrency, subtractWalletCurrency } from "@/lib/api/character";
import { useImageUrls } from "@/hooks/use-image-urls";
import type { KeyedMutator } from "swr";
import useSWR from "swr";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { useMemo, useState } from "react";

type WalletEntry = NonNullable<CharacterDetail["wallet"]>[number];

const EMPTY_WALLET: WalletEntry[] = [];

type CatalogueCurrency = {
  id: string;
  name: string;
  imageKey: string;
};

type WalletSectionContentProps = {
  character: CharacterDetail;
  characterId: string;
  mutate?: KeyedMutator<CharacterDetail | null>;
  readOnly?: boolean;
};

type WalletCurrencyIconProps = {
  name: string;
  imageKey: string;
  imageUrl: string | null | undefined;
};

type WalletHoldingsListProps = {
  wallet: WalletEntry[];
  imageUrls: Record<string, string | null | undefined>;
  readOnly: boolean;
  onAdd: (entry: WalletEntry) => void;
  onSubtract: (entry: WalletEntry) => void;
};

type WalletModalState = {
  isOpen: boolean;
  currencyId: string;
  name: string;
  currentQuantity: number;
  mode: WalletAdjustMode;
};

async function fetchCatalogueCurrencies(
  url: string
): Promise<CatalogueCurrency[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load currencies");
  }
  const json: unknown = await response.json();
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

function WalletCurrencyIcon({
  name,
  imageKey,
  imageUrl,
}: WalletCurrencyIconProps) {
  return (
    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-paleBlue/30">
      {imageUrl ? (
        <SignedRemoteImage
          src={imageUrl}
          imageKey={imageKey}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 object-cover object-center"
        />
      ) : imageUrl === undefined ? (
        <ImageLoadingSkeleton variant="currency" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-black">
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}

function WalletHoldingsList({
  wallet,
  imageUrls,
  readOnly,
  onAdd,
  onSubtract,
}: WalletHoldingsListProps) {
  return (
    <ul className="divide-y divide-black rounded border border-black">
      {wallet.map((entry) => (
        <li
          key={entry.currencyId}
          className="flex items-center gap-3 px-3 py-2.5 first:pt-3 last:pb-3"
        >
          <WalletCurrencyIcon
            name={entry.name}
            imageKey={entry.imageKey}
            imageUrl={imageUrls[entry.currencyId]}
          />
          <span className="text-sm font-medium tabular-nums text-black">
            {entry.quantity}
          </span>
          <span className="min-w-0 truncate text-sm text-black">
            {entry.name}
          </span>
          {!readOnly ? (
            <div className="ml-auto flex shrink-0 gap-1.5">
              <Button
                type="button"
                variant="semanticSafeOutline"
                fullWidth={false}
                onClick={() => onAdd(entry)}
                className="!px-2 !py-0.5 !text-xs"
              >
                ADD
              </Button>
              <Button
                type="button"
                variant="semanticDangerOutline"
                fullWidth={false}
                disabled={entry.quantity < 1}
                onClick={() => onSubtract(entry)}
                className="!px-2 !py-0.5 !text-xs"
              >
                SUBTRACT
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function WalletSectionContent({
  character,
  characterId,
  mutate,
  readOnly = false,
}: WalletSectionContentProps) {
  const [modalState, setModalState] = useState<WalletModalState | null>(null);
  const wallet = character.wallet ?? EMPTY_WALLET;
  const { data: catalogue } = useSWR(
    readOnly ? null : "/api/currencies",
    fetchCatalogueCurrencies
  );

  const heldIds = useMemo(
    () => new Set(wallet.map((entry) => entry.currencyId)),
    [wallet]
  );
  const missingCurrencies = useMemo(
    () => (catalogue ?? []).filter((currency) => !heldIds.has(currency.id)),
    [catalogue, heldIds]
  );
  const imageEntries = useMemo(
    () => [
      ...wallet.map((entry) => ({
        id: entry.currencyId,
        imageKey: entry.imageKey,
      })),
      ...missingCurrencies.map((currency) => ({
        id: currency.id,
        imageKey: currency.imageKey,
      })),
    ],
    [wallet, missingCurrencies]
  );
  const imageUrls = useImageUrls(imageEntries);

  const handleSubmit = async (amount: number) => {
    if (!modalState || !mutate) return;
    const nextWallet =
      modalState.mode === "add"
        ? await addWalletCurrency(characterId, modalState.currencyId, amount)
        : await subtractWalletCurrency(
            characterId,
            modalState.currencyId,
            amount
          );
    await mutate(
      {
        ...character,
        wallet: nextWallet,
      },
      false
    );
  };

  const openAdd = (
    currencyId: string,
    name: string,
    currentQuantity: number
  ) => {
    setModalState({
      isOpen: true,
      currencyId,
      name,
      currentQuantity,
      mode: "add",
    });
  };

  return (
    <>
      {!readOnly && missingCurrencies.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2 pb-2">
          {missingCurrencies.map((currency) => (
            <Button
              key={currency.id}
              type="button"
              variant="lightToolbarCompact"
              fullWidth={false}
              onClick={() => openAdd(currency.id, currency.name, 0)}
            >
              Add {currency.name}
            </Button>
          ))}
        </div>
      ) : null}

      {wallet.length === 0 ? (
        <p className="py-4 text-center text-sm text-black">No money</p>
      ) : (
        <WalletHoldingsList
          wallet={wallet}
          imageUrls={imageUrls}
          readOnly={readOnly}
          onAdd={(entry) =>
            openAdd(entry.currencyId, entry.name, entry.quantity)
          }
          onSubtract={(entry) =>
            setModalState({
              isOpen: true,
              currencyId: entry.currencyId,
              name: entry.name,
              currentQuantity: entry.quantity,
              mode: "subtract",
            })
          }
        />
      )}

      {!readOnly && modalState ? (
        <WalletAdjustModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState(null)}
          mode={modalState.mode}
          currencyName={modalState.name}
          currentQuantity={modalState.currentQuantity}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  );
}

export function getWalletSection(
  character: CharacterDetail,
  characterId: string,
  mutate?: KeyedMutator<CharacterDetail | null>,
  readOnly?: boolean
): CharacterSectionSlide {
  return {
    id: "wallet",
    title: "Wallet",
    children: (
      <WalletSectionContent
        character={character}
        characterId={characterId}
        mutate={readOnly ? undefined : mutate}
        readOnly={readOnly}
      />
    ),
  };
}
