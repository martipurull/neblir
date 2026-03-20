// eslint-disable-next-line no-unused-expressions
"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import {
  WalletAdjustModal,
  type WalletAdjustMode,
} from "@/app/components/character/WalletAdjustModal";
import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import { addWalletCurrency, subtractWalletCurrency } from "@/lib/api/character";
import type { KeyedMutator } from "swr";
import Image from "next/image";
import React, { useState } from "react";

interface WalletSectionContentProps {
  character: CharacterDetail;
  characterId: string;
  imageUrls: Record<string, string | null | undefined>;
  mutate: KeyedMutator<CharacterDetail | null>;
}

function WalletSectionContent({
  character,
  characterId,
  imageUrls,
  mutate,
}: WalletSectionContentProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    currencyName: string;
    currentQuantity: number;
    mode: WalletAdjustMode;
  } | null>(null);

  const handleSubmit = async (amount: number) => {
    if (!modalState) return;
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
  return (
    <>
      <ul className="divide-y divide-black rounded border border-black">
        {wallet.map((entry) => {
          const currencyImageUrl = imageUrls[entry.currencyName];
          return (
            <li
              key={entry.currencyName}
              className="flex items-center gap-3 px-3 py-2.5 first:pt-3 last:pb-3"
            >
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/20">
                {currencyImageUrl ? (
                  <Image
                    src={currencyImageUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 object-cover object-center"
                  />
                ) : currencyImageUrl === undefined ? (
                  <ImageLoadingSkeleton variant="currency" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-black">
                    {entry.currencyName.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium tabular-nums text-black">
                {entry.quantity}
              </span>
              <span className="min-w-0 truncate text-sm text-black">
                {entry.currencyName}
              </span>
              <div className="ml-auto flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setModalState({
                      isOpen: true,
                      currencyName: entry.currencyName,
                      currentQuantity: entry.quantity,
                      mode: "add",
                    })
                  }
                  className="rounded border border-neblirSafe-200 bg-transparent px-2 py-0.5 text-xs font-medium text-neblirSafe-400 transition-colors hover:bg-neblirSafe-200/30"
                >
                  ADD
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setModalState({
                      isOpen: true,
                      currencyName: entry.currencyName,
                      currentQuantity: entry.quantity,
                      mode: "subtract",
                    })
                  }
                  className="rounded border border-neblirDanger-200 bg-transparent px-2 py-0.5 text-xs font-medium text-neblirDanger-400 transition-colors hover:bg-neblirDanger-200/30"
                >
                  SUBTRACT
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {modalState && (
        <WalletAdjustModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState(null)}
          mode={modalState.mode}
          currencyName={modalState.currencyName}
          currentQuantity={modalState.currentQuantity}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}

export function getWalletSection(
  character: CharacterDetail,
  imageUrls: Record<string, string | null | undefined>,
  characterId: string,
  mutate: KeyedMutator<CharacterDetail | null>
): CharacterSectionSlide | null {
  const wallet = character.wallet;
  if (!wallet || wallet.length === 0) return null;

  return {
    id: "wallet",
    title: "Wallet",
    children: (
      <WalletSectionContent
        character={character}
        characterId={characterId}
        imageUrls={imageUrls}
        mutate={mutate}
      />
    ),
  };
}
