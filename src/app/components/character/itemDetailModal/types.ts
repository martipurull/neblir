import type { CharacterDetail } from "@/app/lib/types/character";
import type { SelectDropdownOption } from "@/app/components/shared/SelectDropdown";
import type { KeyedMutator } from "swr";

export type InventoryEntry = NonNullable<CharacterDetail["inventory"]>[number];

export type ResolvedItemNonNull = NonNullable<InventoryEntry["item"]>;

export interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: InventoryEntry;
  characterId: string;
  gameId?: string | null;
  mutate: KeyedMutator<CharacterDetail | null>;
  /** When set, user can give part or all of the stack to another character (same-game rules enforced server-side). */
  resolveGiveRecipients?: (
    entry: InventoryEntry
  ) => Promise<SelectDropdownOption[]>;
}
