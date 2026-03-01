"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import { useHealthStyles } from "@/hooks/use-health-styles";
import React from "react";
import { CharacterHeaderInfo } from "./CharacterHeaderInfo";
import { StatCell } from "./StatCell";

interface CharacterSummaryHeaderProps {
  character: CharacterDetail;
  avatarUrl: string | null;
  /** Current number of reactions used this round; when set, enables reaction tracking UI */
  usedReactions?: number;
  /** Called when user "uses" a reaction (click on Reactions, Melee Def or Range Def) */
  onUseReaction?: () => void;
  className?: string;
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
  const initials =
    generalInformation.name.charAt(0) +
    (generalInformation.surname?.charAt(0) ?? "");
  const equippedWeapon =
    inventory?.find((i) => i.isEquipped && i.item?.type === "WEAPON")?.item
      ?.name ?? "—";

  const { physicalStyles, mentalStyles } = useHealthStyles({
    currentPhysical: health.currentPhysicalHealth,
    maxPhysical: health.maxPhysicalHealth,
    currentMental: health.currentMentalHealth,
    maxMental: health.maxMentalHealth,
  });

  const fmt = (n: number) => (n >= 0 ? `+${n}` : String(n));

  const getArmourStyles = (current: number, max: number) => {
    if (max <= 0) {
      return {
        borderClassName: undefined as string | undefined,
        valueClassName: "text-neblirSafe-600",
        subValueClassName: "text-black",
      };
    }
    const ratio = current / max;
    if (ratio >= 1) {
      return {
        borderClassName: undefined,
        valueClassName: "text-neblirSafe-600",
        subValueClassName: "text-black",
      };
    }
    if (ratio >= 0.5) {
      return {
        borderClassName: "border-neblirWarning-200",
        valueClassName: "text-neblirWarning-400",
        subValueClassName: "text-black",
      };
    }
    return {
      borderClassName: "border-neblirDanger-200",
      valueClassName: "text-neblirDanger-400",
      subValueClassName: "text-black",
    };
  };

  const armourStyles =
    combatInformation.armourMaxHP > 0
      ? getArmourStyles(
          combatInformation.armourCurrentHP,
          combatInformation.armourMaxHP
        )
      : {
          borderClassName: undefined as string | undefined,
          valueClassName: undefined,
          subValueClassName: "text-black" as string,
        };

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
        <CharacterHeaderInfo
          avatarUrl={avatarUrl}
          name={name}
          level={generalInformation.level}
          pathsLabel={pathsLabel}
          initials={initials}
        />

        <div className="mt-3 grid w-full max-w-xs grid-cols-3 gap-1.5">
          <StatCell
            label="Physical"
            value={`${health.currentPhysicalHealth}/${health.maxPhysicalHealth}`}
            subValue={
              health.seriousPhysicalInjuries > 0
                ? `${health.seriousPhysicalInjuries} serious`
                : undefined
            }
            borderClassName={physicalStyles.borderClassName}
            valueClassName={physicalStyles.valueClassName}
          />
          <StatCell
            label="Mental"
            value={`${health.currentMentalHealth}/${health.maxMentalHealth}`}
            subValue={
              health.seriousTrauma > 0
                ? `${health.seriousTrauma} trauma`
                : undefined
            }
            borderClassName={mentalStyles.borderClassName}
            valueClassName={mentalStyles.valueClassName}
          />
          <StatCell
            label="Armour"
            value={
              combatInformation.armourMaxHP > 0
                ? `${combatInformation.armourCurrentHP}/${combatInformation.armourMaxHP}`
                : "—"
            }
            subValue={fmt(combatInformation.armourMod)}
            borderClassName={armourStyles.borderClassName}
            valueClassName={armourStyles.valueClassName}
            subValueClassName={armourStyles.subValueClassName}
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
