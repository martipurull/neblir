"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import Image from "next/image";
import React from "react";

interface CharacterSummaryHeaderProps {
  character: CharacterDetail;
  avatarUrl: string | null;
  /** Current number of reactions used this round; when set, enables reaction tracking UI */
  usedReactions?: number;
  /** Called when user "uses" a reaction (click on Reactions, Melee Def or Range Def) */
  onUseReaction?: () => void;
  className?: string;
}

function StatCell({
  label,
  value,
  subValue,
  compact = false,
  onClick,
  disabled = false,
}: {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  compact?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const cellContent = (
    <>
      <span
        className={
          compact
            ? "text-[10px] text-center font-medium uppercase tracking-wider text-black leading-tight"
            : "text-xs text-center font-medium uppercase tracking-wider text-black leading-tight"
        }
      >
        {label}
      </span>
      <span
        className={
          compact
            ? "mt-0.5 min-w-0 truncate text-center text-xs font-bold text-black"
            : "mt-1 min-w-0 truncate text-center text-sm font-bold text-black"
        }
      >
        {value}
      </span>
      {subValue != null && (
        <span
          className={
            compact
              ? "mt-0.5 min-w-0 truncate text-center text-[10px] text-amber-600 leading-tight"
              : "mt-0.5 min-w-0 truncate text-center text-xs text-amber-600 leading-tight"
          }
        >
          {subValue}
        </span>
      )}
    </>
  );

  const baseCompact =
    "flex h-14 min-w-0 flex-col items-center justify-center rounded-lg border border-black bg-transparent p-1.5";
  const baseDefault =
    "flex aspect-square min-w-0 flex-col items-center justify-center rounded-lg border border-black bg-transparent p-2";
  const disabledClass = disabled ? "cursor-not-allowed opacity-50" : "";
  const clickableClass =
    onClick && !disabled
      ? "cursor-pointer transition hover:bg-black/10 active:bg-black/15"
      : "";

  if (compact) {
    const className = `${baseCompact} ${disabledClass} ${clickableClass}`;
    if (onClick != null) {
      return (
        <button
          type="button"
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          className={className}
        >
          {cellContent}
        </button>
      );
    }
    return <div className={className}>{cellContent}</div>;
  }

  const className = `${baseDefault} ${disabledClass} ${clickableClass}`;
  if (onClick != null) {
    return (
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={className}
      >
        {cellContent}
      </button>
    );
  }
  return <div className={className}>{cellContent}</div>;
}

export function CharacterSummaryHeader({
  character,
  avatarUrl,
  usedReactions = 0,
  onUseReaction,
  className,
}: CharacterSummaryHeaderProps) {
  const { generalInformation, health, combatInformation, inventory } =
    character;
  const name = `${generalInformation.name}${generalInformation.surname ? ` ${generalInformation.surname}` : ""}`;
  const pathsLabel =
    character.paths && character.paths.length > 0
      ? character.paths.map((p) => String(p.name)).join(" / ")
      : "No path";
  const equippedWeapon =
    inventory?.find((i) => i.isEquipped && i.item?.type === "WEAPON")?.item
      ?.name ?? "—";

  const fmt = (n: number) => (n >= 0 ? `+${n}` : String(n));

  const maxReactions = combatInformation.reactionsPerRound;
  const isTrackingReactions = onUseReaction != null;
  const reactionsDisabled =
    isTrackingReactions && usedReactions >= maxReactions;
  const reactionsValue = isTrackingReactions ? (
    <span className="mt-1 flex flex-wrap items-center justify-center gap-1">
      {Array.from({ length: maxReactions }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 shrink-0 rounded-sm border border-black ${i < usedReactions ? "bg-black" : "bg-transparent"}`}
          aria-hidden
        />
      ))}
    </span>
  ) : (
    maxReactions
  );

  return (
    <header
      className={`sticky top-0 z-10 bg-transparent px-4 py-1 ${className ?? ""}`}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center">
        <div className="flex items-center gap-3 pb-2">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/20">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${name} avatar`}
                width={48}
                height={48}
                className="h-12 w-12 object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-black">
                {generalInformation.name.charAt(0)}
                {generalInformation.surname?.charAt(0) ?? ""}
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-base font-bold text-black">{name}</h1>
            <p className="text-sm text-black">
              LVL {generalInformation.level} · {pathsLabel}
            </p>
          </div>
        </div>

        <div className="mt-3 grid w-full max-w-xs grid-cols-3 gap-1.5">
          <StatCell
            label="Physical"
            value={`${health.currentPhysicalHealth}/${health.maxPhysicalHealth}`}
            subValue={
              health.seriousPhysicalInjuries > 0
                ? `${health.seriousPhysicalInjuries} serious`
                : undefined
            }
          />
          <StatCell
            label="Mental"
            value={`${health.currentMentalHealth}/${health.maxMentalHealth}`}
            subValue={
              health.seriousTrauma > 0
                ? `${health.seriousTrauma} trauma`
                : undefined
            }
          />
          <StatCell
            label="Armour"
            value={fmt(combatInformation.armourMod)}
            subValue={
              combatInformation.armourMaxHP > 0
                ? `${combatInformation.armourCurrentHP}/${combatInformation.armourMaxHP} HP`
                : undefined
            }
          />
          <StatCell
            label="Melee Atk"
            value={fmt(combatInformation.meleeAttackMod)}
            compact
          />
          <StatCell
            label="Range Atk"
            value={fmt(combatInformation.rangeAttackMod)}
            compact
          />
          <StatCell label="Equipped Weapon" value={equippedWeapon} compact />
          <StatCell
            label="Melee Def"
            value={fmt(combatInformation.meleeDefenceMod)}
            compact
            onClick={onUseReaction}
            disabled={reactionsDisabled}
          />
          <StatCell
            label="Range Def"
            value={fmt(combatInformation.rangeDefenceMod)}
            compact
            onClick={onUseReaction}
            disabled={reactionsDisabled}
          />
          <StatCell
            label="Reactions"
            value={reactionsValue}
            compact
            onClick={onUseReaction}
            disabled={reactionsDisabled}
          />
          <StatCell
            label="GRID Atk"
            value={fmt(combatInformation.GridAttackMod)}
            compact
          />
          <StatCell
            label="GRID Def"
            value={fmt(combatInformation.GridDefenceMod)}
            compact
          />
          <StatCell
            label="GRID Mod"
            value={fmt(combatInformation.GridMod)}
            compact
          />
        </div>
      </div>
    </header>
  );
}
