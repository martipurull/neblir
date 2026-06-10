import type { EquipSlot } from "@/app/lib/types/character";
import {
  API_SLOT_CAPACITY,
  getApiSlotCapacity,
  getItemCost,
  isCombinedBodyHeadSuit,
} from "@/app/lib/equipUtils";

const SLOT_LABELS: Record<string, string> = {
  HAND: "Hand",
  FOOT: "Foot",
  BODY: "Body",
  HEAD: "Head",
  BRAIN: "Brain",
};

export function formatEquipSlotTypeLabel(slotType: string): string {
  return SLOT_LABELS[slotType] ?? slotType;
}

export type EquipSlotDisplayItem = {
  equippable?: boolean | null;
  equipSlotTypes?: string[] | null;
  equipSlotCost?: number | null;
};

/** Human-readable lines describing how an equippable item uses equip slots. */
export function formatEquipSlotRequirementLines(
  item: EquipSlotDisplayItem
): string[] {
  if (item.equippable !== true) return [];

  const types = item.equipSlotTypes?.filter(Boolean) ?? [];
  const cost = getItemCost(item.equipSlotCost);
  const combinedSuit = isCombinedBodyHeadSuit(types);
  const lines: string[] = [];

  if (types.length === 0) {
    lines.push("Fits any equip area (Hand, Foot, Body, Head, or Brain)");
  } else {
    const labels = [...new Set(types)].map(formatEquipSlotTypeLabel);
    lines.push(
      `Equip area${labels.length > 1 ? "s" : ""}: ${labels.join(", ")}`
    );
  }

  if (combinedSuit) {
    lines.push(
      "Full suit: uses one Body slot and one Head slot per equipped copy"
    );
    if (cost === 2) {
      lines.push(
        `Each occupied area counts as 2 toward that area's ${API_SLOT_CAPACITY}-slot capacity`
      );
    } else if (cost === 0) {
      lines.push("Uses no slot capacity in Body or Head");
    } else {
      lines.push(
        `Uses 1 slot of capacity in each occupied area (${API_SLOT_CAPACITY} slots per area)`
      );
    }
    return lines;
  }

  const uniqueTypes = [...new Set(types)];

  if (uniqueTypes.length === 0) {
    if (cost === 0) {
      lines.push("Uses no slot capacity");
    } else if (cost === 2) {
      lines.push(
        `Uses 2 slots in the chosen area (fills both slots in that area)`
      );
    } else {
      lines.push("Uses 1 slot in the chosen area");
    }
    return lines;
  }

  for (const slotType of uniqueTypes) {
    const label = formatEquipSlotTypeLabel(slotType);
    if (cost === 0) {
      lines.push(`${label}: uses no slot capacity`);
    } else if (cost === 2) {
      const capacity = getApiSlotCapacity(slotType as EquipSlot);
      lines.push(`${label}: uses 2 of ${capacity} slots (fills that area)`);
    } else {
      lines.push(`${label}: uses 1 slot`);
    }
  }

  return lines;
}

/** Summary of where this stack is currently equipped (inventory entry). */
export function formatEquippedSlotsSummary(
  equipSlots: string[] | undefined | null
): string {
  const slots = equipSlots ?? [];
  if (slots.length === 0) return "Not equipped";

  const counts = new Map<string, number>();
  for (const s of slots) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  const parts = [...counts.entries()].map(([slot, count]) => {
    const label = formatEquipSlotTypeLabel(slot);
    return count > 1 ? `${label} ×${count}` : label;
  });
  return parts.join(", ");
}
