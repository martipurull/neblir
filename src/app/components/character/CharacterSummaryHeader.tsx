"use client";

import { getCarriedInventory } from "@/app/lib/constants/inventory";
import {
  formatWeightKgForDisplay,
  getCarriedWeight,
  getCarryWeightStatCellStyles,
  getEffectiveMaxCarryWeight,
} from "@/app/lib/carryWeightUtils";
import type { DisplayEquipSlot } from "@/app/lib/equipUtils";
import {
  getApiSlotsForDisplay,
  HEADER_EQUIP_SLOTS_ROW1,
  HEADER_EQUIP_SLOTS_ROW2,
} from "@/app/lib/equipUtils";
import type { CharacterDetail } from "@/app/lib/types/character";
import { useArmourStyles } from "@/hooks/use-armour-styles";
import { useHealthStyles } from "@/hooks/use-health-styles";
import { useReactionDisplay } from "@/hooks/use-reaction-display";
import type { KeyedMutator } from "swr";
import { updateCharacterInventoryEntry } from "@/lib/api/items";
import React, { useCallback, useMemo, useState } from "react";
import { AttackRollModal } from "./AttackRollModal";
import { CharacterHeaderInfo } from "./CharacterHeaderInfo";
import { GridDefenceRollModal } from "./GridDefenceRollModal";
import { DefenceRollModal } from "./DefenceRollModal";
import { EquipItemPickerModal } from "./EquipItemPickerModal";
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
  /** When provided, header equip cells show equipped items and are clickable to equip */
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

  const [physicalEditKey, setPhysicalEditKey] = useState(0);
  const [mentalEditKey, setMentalEditKey] = useState(0);
  const [armourEditKey, setArmourEditKey] = useState(0);
  const [pickerSlot, setPickerSlot] = useState<DisplayEquipSlot | null>(null);
  const [combatExpanded, setCombatExpanded] = useState(false);

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
  const armourInactive =
    armourDisplay.armourMaxHP <= 0 || armourDisplay.armourCurrentHP <= 0;

  const { value: reactionsValue, disabled: reactionsDisabled } =
    useReactionDisplay({
      reactionsPerRound: combatInformation.reactionsPerRound,
      usedReactions,
      onUseReaction,
    });

  const fmt = (n: number) => (n >= 0 ? `+${n}` : String(n));

  const slotValues = useMemo((): Record<DisplayEquipSlot, React.ReactNode> => {
    const carried = getCarriedInventory(character.inventory ?? undefined);
    const empty: Record<DisplayEquipSlot, React.ReactNode> = {
      HAND: "—",
      FOOT: "—",
      BODY: "—",
      HEAD: "—",
      BRAIN: "—",
    };
    if (!carried.length) {
      return empty;
    }
    const values = { ...empty };
    const maxItems = 2;
    for (const displaySlot of [
      "HAND",
      "FOOT",
      "BODY",
      "HEAD",
      "BRAIN",
    ] as const) {
      const apiSlots = getApiSlotsForDisplay(displaySlot);
      const names: string[] = [];
      for (const entry of carried) {
        const name = entry.customName ?? entry.item?.name ?? "?";
        for (const apiSlot of apiSlots) {
          const count = (entry.equipSlots ?? []).filter(
            (s) => s === apiSlot
          ).length;
          for (let i = 0; i < count && names.length < maxItems; i++) {
            names.push(name);
          }
        }
      }
      if (names.length === 0) {
        values[displaySlot] = "—";
      } else {
        const maxLen = Math.max(...names.map((n) => n.length));
        const textSize =
          maxLen > 14 || names.length > 3
            ? "text-[9px]"
            : maxLen > 8 || names.length > 1
              ? "text-[10px]"
              : "text-xs";
        values[displaySlot] = (
          <div className="flex min-w-0 w-full max-w-full flex-col items-center gap-0 overflow-hidden">
            {names.map((name, i) => (
              <span
                key={i}
                className={`block w-full min-w-0 truncate text-center ${textSize}`}
                title={name}
              >
                {name}
              </span>
            ))}
          </div>
        );
      }
    }
    return values;
  }, [character.inventory]);

  const carriedWeight = useMemo(
    () => getCarriedWeight(character.inventory ?? undefined),
    [character.inventory]
  );
  const maxCarryWeight = useMemo(
    () =>
      getEffectiveMaxCarryWeight(
        character.combatInformation?.maxCarryWeight,
        character.inventory ?? undefined
      ),
    [character.combatInformation?.maxCarryWeight, character.inventory]
  );
  const carryWeightStyles = useMemo(
    () => getCarryWeightStatCellStyles(carriedWeight, maxCarryWeight),
    [carriedWeight, maxCarryWeight]
  );
  const carryWeightDisplay =
    maxCarryWeight != null && maxCarryWeight > 0
      ? `${formatWeightKgForDisplay(carriedWeight)} / ${formatWeightKgForDisplay(maxCarryWeight)} kg`
      : `${formatWeightKgForDisplay(carriedWeight)} kg`;

  const canEquip = !!mutate;

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
                onHealthUpdate
                  ? () => {
                      setPhysicalEditKey((k) => k + 1);
                      setStatModalOpen("physical");
                    }
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
              layout="short"
              borderClassName={mentalStyles.borderClassName}
              valueClassName={mentalStyles.valueClassName}
              onClick={
                onHealthUpdate
                  ? () => {
                      setMentalEditKey((k) => k + 1);
                      setStatModalOpen("mental");
                    }
                  : undefined
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
              disabled={armourInactive}
              onClick={
                onArmourUpdate && !armourInactive
                  ? () => {
                      setArmourEditKey((k) => k + 1);
                      setStatModalOpen("armour");
                    }
                  : undefined
              }
            />
          </div>

          <div className="mt-1.5 grid w-full min-w-0 grid-cols-3 gap-1.5 [&>*]:min-w-0 [&>*]:overflow-hidden">
            {HEADER_EQUIP_SLOTS_ROW1.map(({ slot, label }) => (
              <StatCell
                key={slot}
                label={label}
                value={slotValues[slot]}
                compact
                alignTop
                onClick={canEquip ? () => setPickerSlot(slot) : undefined}
              />
            ))}
          </div>

          <div className="mt-1.5 grid w-full min-w-0 grid-cols-3 gap-1.5 [&>*]:min-w-0 [&>*]:overflow-hidden">
            {HEADER_EQUIP_SLOTS_ROW2.map(({ slot, label }) => (
              <StatCell
                key={slot}
                label={label}
                value={slotValues[slot]}
                compact
                alignTop
                onClick={canEquip ? () => setPickerSlot(slot) : undefined}
              />
            ))}
            <StatCell
              label="Carry"
              value={carryWeightDisplay}
              compact
              borderClassName={carryWeightStyles.borderClassName}
              valueClassName={carryWeightStyles.valueClassName}
            />
          </div>

          {combatExpanded && (
            <>
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
                    onUseReaction
                      ? () => setMeleeDefenceRollOpen(true)
                      : undefined
                  }
                  disabled={!onUseReaction || reactionsDisabled}
                />
                <StatCell
                  label="Range Def"
                  value={fmt(effectiveMods.rangeDefenceMod)}
                  compact
                  onClick={
                    onUseReaction
                      ? () => setRangeDefenceRollOpen(true)
                      : undefined
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

              <div className="mt-1.5 grid w-full min-w-0 grid-cols-3 gap-1.5">
                <StatCell
                  label="GRID Atk"
                  value={showGridAttack ? fmt(gridAttackDisplayMod) : "—"}
                  compact
                  onClick={
                    showGridAttack
                      ? () => setAttackRollModal("grid")
                      : undefined
                  }
                />
                <StatCell
                  label="GRID Def"
                  value={fmt(gridDefenceDice)}
                  compact
                  onClick={
                    reactionsDisabled
                      ? undefined
                      : () => setGridDefenceRollOpen(true)
                  }
                  disabled={reactionsDisabled}
                />
                <StatCell label="GRID Mods" value={gridModCellValue} compact />
              </div>
            </>
          )}

          <div className="mt-1.5 grid w-full grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setCombatExpanded((v) => !v)}
              aria-expanded={combatExpanded}
              className="col-span-3 flex w-full min-w-0 items-center justify-center rounded-lg border border-black bg-transparent px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-black transition hover:bg-black/10 active:bg-black/15"
            >
              {combatExpanded ? "HIDE COMBAT" : "SHOW COMBAT"}
            </button>
          </div>
        </div>

        {mutate && pickerSlot && (
          <EquipItemPickerModal
            isOpen={!!pickerSlot}
            onClose={() => setPickerSlot(null)}
            slot={pickerSlot}
            character={character}
            mutate={mutate}
          />
        )}

        {onHealthUpdate && (
          <StatEditModal
            key={`stat-edit-physical-${physicalEditKey}`}
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
            key={`stat-edit-mental-${mentalEditKey}`}
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
            key={`stat-edit-armour-${armourEditKey}`}
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
