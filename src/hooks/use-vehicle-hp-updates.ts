"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import type {
  VehicleCharacter,
  VehicleDerivedStatus,
} from "@/app/lib/types/vehicle";
import { updateCharacterVehicleEntry } from "@/lib/api/vehicles";
import { useCallback, useLayoutEffect, useRef } from "react";
import type { KeyedMutator } from "swr";

/** Same debounce window as character health / armour updates. */
const DEBOUNCE_MS = 2500;

function derivedStatusForHp(
  currentHp: number,
  isBeyondRepair: boolean
): VehicleDerivedStatus {
  if (isBeyondRepair) return "BEYOND_REPAIR";
  if (currentHp <= 0) return "BROKEN_DOWN";
  return "OPERATIONAL";
}

function withOptimisticHp(
  vehicle: VehicleCharacter,
  currentHp: number
): VehicleCharacter {
  const derivedStatus = derivedStatusForHp(currentHp, vehicle.isBeyondRepair);
  return {
    ...vehicle,
    currentHp,
    derivedStatus,
    canBeRidden: derivedStatus === "OPERATIONAL",
  };
}

function replaceVehicleInCharacter(
  character: CharacterDetail,
  vehicle: VehicleCharacter
): CharacterDetail {
  return {
    ...character,
    vehicles: (character.vehicles ?? []).map((row) =>
      row.id === vehicle.id ? vehicle : row
    ),
  };
}

export function useVehicleHpUpdates(
  characterId: string,
  character: CharacterDetail | null,
  mutate: KeyedMutator<CharacterDetail | null>
) {
  const characterRef = useRef(character);
  useLayoutEffect(() => {
    characterRef.current = character;
  }, [character]);

  const timeoutByVehicleIdRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>()
  );
  const pendingHpByVehicleIdRef = useRef(new Map<string, number>());

  const persistVehicleHp = useCallback(
    async (vehicleCharacterId: string) => {
      const currentHp = pendingHpByVehicleIdRef.current.get(vehicleCharacterId);
      pendingHpByVehicleIdRef.current.delete(vehicleCharacterId);
      if (currentHp == null || !characterId) return;

      try {
        const updated = await updateCharacterVehicleEntry(
          characterId,
          vehicleCharacterId,
          { action: "setHp", currentHp }
        );
        const cur = characterRef.current;
        if (!cur) {
          await mutate();
          return;
        }
        const next = replaceVehicleInCharacter(cur, updated);
        characterRef.current = next;
        await mutate(next, false);
      } catch {
        await mutate();
      }
    },
    [characterId, mutate]
  );

  const flushVehicleHp = useCallback(
    (vehicleCharacterId: string) => {
      const timeout = timeoutByVehicleIdRef.current.get(vehicleCharacterId);
      if (timeout) {
        clearTimeout(timeout);
        timeoutByVehicleIdRef.current.delete(vehicleCharacterId);
      }
      if (!pendingHpByVehicleIdRef.current.has(vehicleCharacterId)) return;
      void persistVehicleHp(vehicleCharacterId);
    },
    [persistVehicleHp]
  );

  const adjustVehicleHp = useCallback(
    (vehicleCharacterId: string, delta: number) => {
      const cur = characterRef.current;
      if (!cur) return;

      const vehicle = (cur.vehicles ?? []).find(
        (row) => row.id === vehicleCharacterId
      );
      if (!vehicle) return;

      const maxHp = vehicle.effectiveMaxHp;
      const uncapped = vehicle.currentHp + delta;
      const nextHp =
        maxHp != null && maxHp > 0
          ? Math.max(0, Math.min(maxHp, uncapped))
          : Math.max(0, uncapped);
      if (nextHp === vehicle.currentHp) return;

      const optimisticVehicle = withOptimisticHp(vehicle, nextHp);
      const nextCharacter = replaceVehicleInCharacter(cur, optimisticVehicle);
      characterRef.current = nextCharacter;
      void mutate(nextCharacter, false);

      pendingHpByVehicleIdRef.current.set(vehicleCharacterId, nextHp);

      const existingTimeout =
        timeoutByVehicleIdRef.current.get(vehicleCharacterId);
      if (existingTimeout) clearTimeout(existingTimeout);
      timeoutByVehicleIdRef.current.set(
        vehicleCharacterId,
        setTimeout(() => {
          timeoutByVehicleIdRef.current.delete(vehicleCharacterId);
          void persistVehicleHp(vehicleCharacterId);
        }, DEBOUNCE_MS)
      );
    },
    [mutate, persistVehicleHp]
  );

  return { adjustVehicleHp, flushVehicleHp };
}
