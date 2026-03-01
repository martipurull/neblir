"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import type { CharacterDetail } from "@/app/lib/types/character";
import Image from "next/image";
import React from "react";

export function getWalletSection(
  character: CharacterDetail,
  imageUrls: Record<string, string | null>
): CharacterSectionSlide | null {
  const wallet = character.wallet;
  if (!wallet || wallet.length === 0) return null;

  return {
    id: "wallet",
    title: "Wallet",
    children: (
      <ul className="divide-y divide-black border border-black rounded">
        {wallet.map((entry) => {
          const currencyImageUrl = imageUrls[entry.currencyName] ?? null;
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
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-black">
                    {entry.currencyName.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium tabular-nums text-black">
                {entry.quantity}
              </span>
              <span className="text-sm text-black min-w-0 truncate">
                {entry.currencyName}
              </span>
              <div className="ml-auto flex shrink-0 gap-1.5">
                <button
                  type="button"
                  className="rounded border border-neblirSafe-200 bg-transparent px-2 py-0.5 text-xs font-medium text-neblirSafe-400"
                >
                  ADD
                </button>
                <button
                  type="button"
                  className="rounded border border-neblirDanger-200 bg-transparent px-2 py-0.5 text-xs font-medium text-neblirDanger-400"
                >
                  SUBTRACT
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    ),
  };
}
