import type { CharacterDetail } from "@/app/lib/types/character";
import {
  updateCharacterInventoryEntry,
  type InventoryEntry,
  type UpdateInventoryEntryBody,
} from "@/lib/api/items";
import type { KeyedMutator } from "swr";

export function mergeInventoryEntryIntoCharacter(
  character: CharacterDetail,
  updated: InventoryEntry
): CharacterDetail {
  const inventory = character.inventory ?? [];
  const hasEntry = inventory.some((e) => e.id === updated.id);
  const nextInventory = hasEntry
    ? inventory.map((e) => {
        if (e.id !== updated.id) return e;
        return {
          ...e,
          ...updated,
          item:
            updated.item != null && e.item != null
              ? { ...e.item, ...updated.item }
              : (updated.item ?? e.item),
        };
      })
    : [...inventory, updated];
  return { ...character, inventory: nextInventory };
}

/** PATCH inventory entry, merge into SWR cache immediately, then revalidate. */
export async function patchCharacterInventoryEntryAndMutate(
  mutate: KeyedMutator<CharacterDetail | null>,
  characterId: string,
  itemCharacterId: string,
  body: UpdateInventoryEntryBody
): Promise<InventoryEntry> {
  const updated = await updateCharacterInventoryEntry(
    characterId,
    itemCharacterId,
    body
  );
  await mutate(
    (current) =>
      current ? mergeInventoryEntryIntoCharacter(current, updated) : current,
    { revalidate: true }
  );
  return updated;
}
