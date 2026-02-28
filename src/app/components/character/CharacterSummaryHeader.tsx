"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import Image from "next/image";
import React from "react";

interface CharacterSummaryHeaderProps {
  character: CharacterDetail;
  avatarUrl: string | null;
}

export function CharacterSummaryHeader({
  character,
  avatarUrl,
}: CharacterSummaryHeaderProps) {
  const { generalInformation, health, combatInformation } = character;
  const name = `${generalInformation.name}${generalInformation.surname ? ` ${generalInformation.surname}` : ""}`;

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gray-100">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${name} avatar`}
                width={56}
                height={56}
                className="h-14 w-14 object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
                {generalInformation.name.charAt(0)}
                {generalInformation.surname?.charAt(0) ?? ""}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{name}</h1>
            <p className="text-sm text-gray-600">
              LVL {generalInformation.level}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
          <div className="flex gap-3">
            <span className="text-gray-500">Physical:</span>
            <span className="font-medium">
              {health.currentPhysicalHealth}/{health.maxPhysicalHealth}
            </span>
            {health.seriousPhysicalInjuries > 0 && (
              <span className="text-amber-600">
                ({health.seriousPhysicalInjuries} serious)
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <span className="text-gray-500">Mental:</span>
            <span className="font-medium">
              {health.currentMentalHealth}/{health.maxMentalHealth}
            </span>
            {health.seriousTrauma > 0 && (
              <span className="text-amber-600">
                ({health.seriousTrauma} trauma)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
          <div>
            <span className="text-gray-500">Attack </span>
            <span className="font-medium">
              R {combatInformation.rangeAttackMod >= 0 ? "+" : ""}
              {combatInformation.rangeAttackMod} / M{" "}
              {combatInformation.meleeAttackMod >= 0 ? "+" : ""}
              {combatInformation.meleeAttackMod} / G{" "}
              {combatInformation.GridAttackMod >= 0 ? "+" : ""}
              {combatInformation.GridAttackMod}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Defence </span>
            <span className="font-medium">
              R {combatInformation.rangeDefenceMod >= 0 ? "+" : ""}
              {combatInformation.rangeDefenceMod} / M{" "}
              {combatInformation.meleeDefenceMod >= 0 ? "+" : ""}
              {combatInformation.meleeDefenceMod} / G{" "}
              {combatInformation.GridDefenceMod >= 0 ? "+" : ""}
              {combatInformation.GridDefenceMod}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Armour </span>
            <span className="font-medium">
              {combatInformation.armourMod >= 0 ? "+" : ""}
              {combatInformation.armourMod}
              {combatInformation.armourMaxHP > 0 && (
                <>
                  {" "}
                  ({combatInformation.armourCurrentHP}/
                  {combatInformation.armourMaxHP} HP)
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
