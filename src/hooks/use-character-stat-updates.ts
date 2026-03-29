"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import {
  updateCharacterHealth,
  updateCharacterCombatInfo,
} from "@/lib/api/character";
import type { KeyedMutator } from "swr";
import { useRef, useCallback } from "react";

const DEBOUNCE_MS = 2500;

type HealthPartial = {
  currentPhysicalHealth?: number;
  currentMentalHealth?: number;
  seriousPhysicalInjuries?: number;
  seriousTrauma?: number;
};

type ArmourPartial = {
  armourCurrentHP?: number;
};

export function useCharacterStatUpdates(
  characterId: string,
  character: CharacterDetail | null,
  mutate: KeyedMutator<CharacterDetail | null>
) {
  const healthTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armourTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingHealthRef = useRef<HealthPartial | null>(null);
  const pendingArmourRef = useRef<ArmourPartial | null>(null);

  const saveHealth = useCallback(async () => {
    const payload = pendingHealthRef.current;
    pendingHealthRef.current = null;
    if (!payload || !characterId) return;
    try {
      const updated = await updateCharacterHealth(characterId, payload);
      await mutate(updated, false);
    } catch {
      await mutate();
    }
  }, [characterId, mutate]);

  const saveArmour = useCallback(async () => {
    const payload = pendingArmourRef.current;
    pendingArmourRef.current = null;
    if (!payload || !characterId) return;
    try {
      const updated = await updateCharacterCombatInfo(characterId, payload);
      await mutate(updated, false);
    } catch {
      await mutate();
    }
  }, [characterId, mutate]);

  const updateHealth = useCallback(
    (partial: HealthPartial) => {
      if (!character) return;
      const newHealth = { ...character.health, ...partial };
      const newCharacter = { ...character, health: newHealth };
      void mutate(newCharacter, false);

      pendingHealthRef.current = {
        currentPhysicalHealth: newHealth.currentPhysicalHealth,
        currentMentalHealth: newHealth.currentMentalHealth,
        seriousPhysicalInjuries: newHealth.seriousPhysicalInjuries,
        seriousTrauma: newHealth.seriousTrauma,
      };

      if (healthTimeoutRef.current) {
        clearTimeout(healthTimeoutRef.current);
      }
      healthTimeoutRef.current = setTimeout(() => {
        healthTimeoutRef.current = null;
        void saveHealth();
      }, DEBOUNCE_MS);
    },
    [character, mutate, saveHealth]
  );

  const updateArmour = useCallback(
    (partial: ArmourPartial) => {
      if (!character?.combatInformation) return;
      const newCombat = {
        ...character.combatInformation,
        ...partial,
      };
      const newCharacter = {
        ...character,
        combatInformation: newCombat,
      };
      void mutate(newCharacter, false);

      pendingArmourRef.current = {
        armourCurrentHP: newCombat.armourCurrentHP,
      };

      if (armourTimeoutRef.current) {
        clearTimeout(armourTimeoutRef.current);
      }
      armourTimeoutRef.current = setTimeout(() => {
        armourTimeoutRef.current = null;
        void saveArmour();
      }, DEBOUNCE_MS);
    },
    [character, mutate, saveArmour]
  );

  return { updateHealth, updateArmour };
}
