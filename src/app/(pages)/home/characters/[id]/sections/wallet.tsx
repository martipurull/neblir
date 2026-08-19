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
import {
  currencyImageKey,
  getMissingWalletCurrencies,
  type CurrencyName,
} from "@/app/lib/types/item";
import type { KeyedMutator } from "swr";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { useState } from "react";

type WalletEntry = NonNullable<CharacterDetail["wallet"]>[number];

type WalletSectionContentProps = {
  character: CharacterDetail;
  characterId: string;
  imageUrls: Record<string, string | null | undefined>;
  mutate?: KeyedMutator<CharacterDetail | null>;
  readOnly?: boolean;
};

type WalletCurrencyIconProps = {
  currencyName: string;
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
  currencyName: CurrencyName;
  currentQuantity: number;
  mode: WalletAdjustMode;
};

function WalletCurrencyIcon({
  currencyName,
  imageUrl,
}: WalletCurrencyIconProps) {
  return (
    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-paleBlue/30">
      {imageUrl ? (
        <SignedRemoteImage
          src={imageUrl}
          imageKey={currencyImageKey(currencyName)}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 object-cover object-center"
        />
      ) : imageUrl === undefined ? (
        <ImageLoadingSkeleton variant="currency" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-black">
          {currencyName.charAt(0)}
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
          key={entry.currencyName}
          className="flex items-center gap-3 px-3 py-2.5 first:pt-3 last:pb-3"
        >
          <WalletCurrencyIcon
            currencyName={entry.currencyName}
            imageUrl={imageUrls[entry.currencyName]}
          />
          <span className="text-sm font-medium tabular-nums text-black">
            {entry.quantity}
          </span>
          <span className="min-w-0 truncate text-sm text-black">
            {entry.currencyName}
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
  imageUrls,
  mutate,
  readOnly = false,
}: WalletSectionContentProps) {
  const [modalState, setModalState] = useState<WalletModalState | null>(null);

  const handleSubmit = async (amount: number) => {
    if (!modalState || !mutate) return;
    const wallet =
      modalState.mode === "add"
        ? await addWalletCurrency(characterId, modalState.currencyName, amount)
        : await subtractWalletCurrency(
            characterId,
            modalState.currencyName,
            amount
          );
    await mutate(
      {
        ...character,
        wallet: wallet as CharacterDetail["wallet"],
      },
      false
    );
  };

  const wallet = character.wallet ?? [];
  const missingCurrencies = getMissingWalletCurrencies(wallet);

  const openAdd = (currencyName: CurrencyName, currentQuantity: number) => {
    setModalState({
      isOpen: true,
      currencyName,
      currentQuantity,
      mode: "add",
    });
  };

  return (
    <>
      {!readOnly && missingCurrencies.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2 pb-2">
          {missingCurrencies.map((currencyName) => (
            <Button
              key={currencyName}
              type="button"
              variant="lightToolbarCompact"
              fullWidth={false}
              onClick={() => openAdd(currencyName, 0)}
            >
              Add {currencyName}
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
          onAdd={(entry) => openAdd(entry.currencyName, entry.quantity)}
          onSubtract={(entry) =>
            setModalState({
              isOpen: true,
              currencyName: entry.currencyName,
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
          currencyName={modalState.currencyName}
          currentQuantity={modalState.currentQuantity}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  );
}

export function getWalletSection(
  character: CharacterDetail,
  imageUrls: Record<string, string | null | undefined>,
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
        imageUrls={imageUrls}
        mutate={readOnly ? undefined : mutate}
        readOnly={readOnly}
      />
    ),
  };
}
