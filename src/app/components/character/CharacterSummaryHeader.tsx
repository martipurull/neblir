"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import { useArmourStyles } from "@/hooks/use-armour-styles";
import { useHealthStyles } from "@/hooks/use-health-styles";
import { useReactionDisplay } from "@/hooks/use-reaction-display";
import type { KeyedMutator } from "swr";
import { updateCharacterInventoryEntry } from "@/lib/api/items";
import React, { useCallback } from "react";
import { AttackRollModal } from "./AttackRollModal";
import { CharacterHeaderInfo } from "./CharacterHeaderInfo";
import { GridDefenceRollModal } from "./GridDefenceRollModal";
import { DefenceRollModal } from "./DefenceRollModal";
import { HeaderStatsCarouselRow } from "./HeaderStatsCarouselRow";
import { StatCell } from "./StatCell";
import { StatEditModal } from "./StatEditModal";
import { useCharacterHeaderModals } from "./useCharacterHeaderModals";
import { useCharacterHeaderStats } from "./useCharacterHeaderStats";

type HealthPartial = {
  currentPhysicalHealth?: number;
  currentMentalHealth?: number;
  seriousPhysicalInjuries?: number;
  seriousTrauma?: number;
};

type ArmourPartial = { armourCurrentHP?: number };

interface CharacterSummaryHeaderProps {
  character: CharacterDetail;
  primaryGameId?: string | null;
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
  primaryGameId,
  avatarUrl,
  usedReactions = 0,
  onUseReaction,
  onHealthUpdate,
  onArmourUpdate,
  mutate,
  className,
}: CharacterSummaryHeaderProps) {
  const {
    statModalOpen,
    setStatModalOpen,
    attackRollModal,
    setAttackRollModal,
    gridDefenceRollOpen,
    setGridDefenceRollOpen,
    meleeDefenceRollOpen,
    setMeleeDefenceRollOpen,
    rangeDefenceRollOpen,
    setRangeDefenceRollOpen,
  } = useCharacterHeaderModals();

  const {
    generalInformation,
    health,
    combatInformation,
    name,
    pathsLabel,
    armourDisplay,
    effectiveMods,
    attackModArrays,
    gridAttackOptions,
    showGridAttack,
    gridAttackDisplayMod,
    gridDefenceDice,
    gridModCellValue,
    gridAttackModifierHint,
    gridAttackDamageHint,
    gridDefenceModifierHint,
  } = useCharacterHeaderStats(character);
  const { physicalStyles, mentalStyles } = useHealthStyles({
    currentPhysical: health.currentPhysicalHealth,
    maxPhysical: health.maxPhysicalHealth,
    currentMental: health.currentMentalHealth,
    maxMental: health.maxMentalHealth,
  });

  const handleWeaponUsed = useCallback(
    async (itemCharacterId: string) => {
      if (!mutate) return;
      try {
        await updateCharacterInventoryEntry(character.id, itemCharacterId, {
          action: "decrementUse",
        });
        await mutate();
      } catch {
        await mutate();
      }
    },
    [character.id, mutate]
  );

  const formatAttackMod = (options: { mod: number }[]) =>
    options.map((o) => fmt(o.mod)).join(" / ");
  const armourStyles = useArmourStyles(
    armourDisplay.armourCurrentHP,
    armourDisplay.armourMaxHP
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
          characterId={character.id}
        />

        <div className="mt-3 w-full">
          {/* Top row: featured stats (always 3 across, fill available width) */}
          <div className="grid w-full grid-cols-3 gap-1.5">
            <StatCell
              label="Physical"
              value={`${health.currentPhysicalHealth}/${health.maxPhysicalHealth}`}
              subValue={
                health.seriousPhysicalInjuries > 0
                  ? `${health.seriousPhysicalInjuries} serious`
                  : undefined
              }
              layout="short"
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
              layout="short"
              borderClassName={mentalStyles.borderClassName}
              valueClassName={mentalStyles.valueClassName}
              onClick={
                onHealthUpdate ? () => setStatModalOpen("mental") : undefined
              }
            />
            <StatCell
              label="Armour"
              value={`${armourDisplay.armourCurrentHP}/${armourDisplay.armourMaxHP}`}
              subValue={fmt(armourDisplay.armourMod)}
              layout="short"
              borderClassName={armourStyles.borderClassName}
              valueClassName={armourStyles.valueClassName}
              subValueClassName={armourStyles.subValueClassName}
              onClick={
                armourDisplay.armourMaxHP > 0 && onArmourUpdate
                  ? () => setStatModalOpen("armour")
                  : undefined
              }
            />
          </div>

          {/* Rest: compact stats (same number of cells per row at each breakpoint) */}
          <div className="mt-1.5 grid w-full grid-cols-3 gap-1.5">
            <StatCell
              label="Melee Atk"
              value={formatAttackMod(attackModArrays.melee)}
              compact
              onClick={() => setAttackRollModal("melee")}
            />
            <StatCell
              label="Range Atk"
              value={formatAttackMod(attackModArrays.range)}
              compact
              onClick={() => setAttackRollModal("range")}
            />
            <StatCell
              label="Throw Atk"
              value={formatAttackMod(attackModArrays.throw)}
              compact
              onClick={() => setAttackRollModal("throw")}
            />
            <StatCell
              label="Melee Def"
              value={fmt(effectiveMods.meleeDefenceMod)}
              compact
              onClick={
                onUseReaction ? () => setMeleeDefenceRollOpen(true) : undefined
              }
              disabled={!onUseReaction || reactionsDisabled}
            />
            <StatCell
              label="Range Def"
              value={fmt(effectiveMods.rangeDefenceMod)}
              compact
              onClick={
                onUseReaction ? () => setRangeDefenceRollOpen(true) : undefined
              }
              disabled={!onUseReaction || reactionsDisabled}
            />
            <StatCell
              label="Reactions"
              value={reactionsValue}
              compact
              onClick={onUseReaction}
              disabled={reactionsDisabled}
            />
          </div>
        </div>

        <HeaderStatsCarouselRow
          fmt={fmt}
          character={character}
          mutate={mutate}
          showGridAttack={showGridAttack}
          gridAttackDisplayMod={gridAttackDisplayMod}
          gridDefenceDisplayMod={gridDefenceDice}
          gridModCellValue={gridModCellValue}
          onGridAttack={() => setAttackRollModal("grid")}
          onGridDefence={() => setGridDefenceRollOpen(true)}
          gridDefenceDisabled={reactionsDisabled}
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
        {onArmourUpdate && armourDisplay.armourMaxHP > 0 && (
          <StatEditModal
            isOpen={statModalOpen === "armour"}
            onClose={() => setStatModalOpen(null)}
            type="armour"
            currentHP={armourDisplay.armourCurrentHP}
            maxHP={armourDisplay.armourMaxHP}
            onUpdate={(u) => {
              if (u.currentHP != null) {
                onArmourUpdate({ armourCurrentHP: u.currentHP });
              }
            }}
          />
        )}
        <AttackRollModal
          isOpen={attackRollModal !== null}
          onClose={() => setAttackRollModal(null)}
          attackType={attackRollModal ?? "melee"}
          modifierHint={
            attackRollModal === "grid" ? gridAttackModifierHint : undefined
          }
          damageHint={
            attackRollModal === "grid" ? gridAttackDamageHint : undefined
          }
          options={
            attackRollModal === "melee"
              ? attackModArrays.melee
              : attackRollModal === "range"
                ? attackModArrays.range
                : attackRollModal === "throw"
                  ? attackModArrays.throw
                  : gridAttackOptions
          }
          onWeaponUsed={handleWeaponUsed}
          gameId={primaryGameId}
          characterId={character.id}
        />

        <DefenceRollModal
          isOpen={meleeDefenceRollOpen}
          onClose={() => setMeleeDefenceRollOpen(false)}
          defenceDice={effectiveMods.meleeDefenceMod}
          title="Melee Defence"
          reactionDisabled={!onUseReaction || reactionsDisabled}
          onRollReaction={onUseReaction}
          gameId={primaryGameId}
          characterId={character.id}
        />
        <DefenceRollModal
          isOpen={rangeDefenceRollOpen}
          onClose={() => setRangeDefenceRollOpen(false)}
          defenceDice={effectiveMods.rangeDefenceMod}
          title="Range Defence"
          reactionDisabled={!onUseReaction || reactionsDisabled}
          onRollReaction={onUseReaction}
          gameId={primaryGameId}
          characterId={character.id}
        />

        <GridDefenceRollModal
          isOpen={gridDefenceRollOpen}
          onClose={() => setGridDefenceRollOpen(false)}
          defenceDice={gridDefenceDice}
          modifierHint={gridDefenceModifierHint}
          reactionDisabled={!onUseReaction || reactionsDisabled}
          onRollReaction={onUseReaction}
          gameId={primaryGameId}
          characterId={character.id}
        />
      </div>
    </header>
  );
}
