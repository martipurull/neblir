"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import { useArmourStyles } from "@/hooks/use-armour-styles";
import { useHealthStyles } from "@/hooks/use-health-styles";
import { useReactionDisplay } from "@/hooks/use-reaction-display";
import type { KeyedMutator } from "swr";
import React, { useState } from "react";
import { CharacterHeaderInfo } from "./CharacterHeaderInfo";
import { HeaderStatsCarouselRow } from "./HeaderStatsCarouselRow";
import { StatCell } from "./StatCell";
import { StatEditModal, type StatEditType } from "./StatEditModal";

type HealthPartial = {
  currentPhysicalHealth?: number;
  currentMentalHealth?: number;
  seriousPhysicalInjuries?: number;
  seriousTrauma?: number;
};

type ArmourPartial = { armourCurrentHP?: number };

interface CharacterSummaryHeaderProps {
  character: CharacterDetail;
  avatarUrl: string | null;
  /** Current number of reactions used this round; when set, enables reaction tracking UI */
  usedReactions?: number;
  /** Called when user "uses" a reaction (click on Reactions, Melee Def or Range Def) */
  onUseReaction?: () => void;
  /** Called when user updates health (physical or mental); enables stat edit modal */
  onHealthUpdate?: (partial: HealthPartial) => void;
  /** Called when user updates armour; enables stat edit modal */
  onArmourUpdate?: (partial: ArmourPartial) => void;
  /** When provided, Hand/Foot/Body equip cells show equipped items and are clickable to equip */
  mutate?: KeyedMutator<CharacterDetail | null>;
  className?: string;
}

export function CharacterSummaryHeader({
  character,
  avatarUrl,
  usedReactions = 0,
  onUseReaction,
  onHealthUpdate,
  onArmourUpdate,
  mutate,
  className,
}: CharacterSummaryHeaderProps) {
  const [statModalOpen, setStatModalOpen] = useState<StatEditType | null>(null);
  const { generalInformation, health, combatInformation } = character;
  const name = `${generalInformation.name}${generalInformation.surname ? ` ${generalInformation.surname}` : ""}`;
  const pathsLabel =
    character.paths && character.paths.length > 0
      ? character.paths.map((p) => String(p.name)).join(" / ")
      : "No path";
  const initials =
    generalInformation.name.charAt(0) +
    (generalInformation.surname?.charAt(0) ?? "");

  const { physicalStyles, mentalStyles } = useHealthStyles({
    currentPhysical: health.currentPhysicalHealth,
    maxPhysical: health.maxPhysicalHealth,
    currentMental: health.currentMentalHealth,
    maxMental: health.maxMentalHealth,
  });

  const armourStyles = useArmourStyles(
    combatInformation.armourCurrentHP,
    combatInformation.armourMaxHP
  );

  const { value: reactionsValue, disabled: reactionsDisabled } =
    useReactionDisplay({
      reactionsPerRound: combatInformation.reactionsPerRound,
      usedReactions,
      onUseReaction,
    });

  const fmt = (n: number) => (n >= 0 ? `+${n}` : String(n));

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
            onClick={
              onHealthUpdate ? () => setStatModalOpen("physical") : undefined
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
            borderClassName={mentalStyles.borderClassName}
            valueClassName={mentalStyles.valueClassName}
            onClick={
              onHealthUpdate ? () => setStatModalOpen("mental") : undefined
            }
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
            onClick={
              onArmourUpdate ? () => setStatModalOpen("armour") : undefined
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
          <StatCell
            label="Throw Atk"
            value={fmt(combatInformation.throwAttackMod)}
            compact
          />
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
        </div>

        <HeaderStatsCarouselRow
          combatInformation={combatInformation}
          fmt={fmt}
          character={character}
          mutate={mutate}
        />

        {onHealthUpdate && (
          <StatEditModal
            isOpen={statModalOpen === "physical"}
            onClose={() => setStatModalOpen(null)}
            type="physical"
            currentHP={health.currentPhysicalHealth}
            maxHP={health.maxPhysicalHealth}
            seriousInjuries={health.seriousPhysicalInjuries}
            onUpdate={(u) =>
              onHealthUpdate({
                ...(u.currentHP != null && {
                  currentPhysicalHealth: u.currentHP,
                }),
                ...(u.seriousInjuries != null && {
                  seriousPhysicalInjuries: u.seriousInjuries,
                }),
              })
            }
          />
        )}
        {onHealthUpdate && (
          <StatEditModal
            isOpen={statModalOpen === "mental"}
            onClose={() => setStatModalOpen(null)}
            type="mental"
            currentHP={health.currentMentalHealth}
            maxHP={health.maxMentalHealth}
            seriousTrauma={health.seriousTrauma}
            onUpdate={(u) =>
              onHealthUpdate({
                ...(u.currentHP != null && {
                  currentMentalHealth: u.currentHP,
                }),
                ...(u.seriousTrauma != null && {
                  seriousTrauma: u.seriousTrauma,
                }),
              })
            }
          />
        )}
        {onArmourUpdate && (
          <StatEditModal
            isOpen={statModalOpen === "armour"}
            onClose={() => setStatModalOpen(null)}
            type="armour"
            currentHP={combatInformation.armourCurrentHP}
            maxHP={combatInformation.armourMaxHP}
            onUpdate={(u) => {
              if (u.currentHP != null) {
                onArmourUpdate({ armourCurrentHP: u.currentHP });
              }
            }}
          />
        )}
      </div>
    </header>
  );
}
