import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import {
  DEFAULT_CHARACTER_SECTION_ORDER,
  type CharacterSectionId,
  type CharacterSectionOrder,
  isCharacterSectionId,
} from "@/app/lib/constants/characterSections";

/** Reorder built sections using saved preference, appending any missing slides in default order. */
export function applyCharacterSectionOrder(
  sections: CharacterSectionSlide[],
  savedOrder: CharacterSectionOrder | null | undefined
): CharacterSectionSlide[] {
  if (sections.length <= 1) return sections;

  const byId = new Map(sections.map((section) => [section.id, section]));
  const preferredOrder =
    savedOrder?.filter(isCharacterSectionId) ?? DEFAULT_CHARACTER_SECTION_ORDER;

  const ordered: CharacterSectionSlide[] = [];
  const placed = new Set<string>();

  for (const id of preferredOrder) {
    const section = byId.get(id);
    if (!section) continue;
    ordered.push(section);
    placed.add(id);
  }

  for (const id of DEFAULT_CHARACTER_SECTION_ORDER) {
    if (placed.has(id)) continue;
    const section = byId.get(id);
    if (!section) continue;
    ordered.push(section);
    placed.add(id);
  }

  for (const section of sections) {
    if (!placed.has(section.id)) {
      ordered.push(section);
    }
  }

  return ordered;
}

/** Full section id list for settings UI (saved order first, then default append). */
export function resolveCharacterSectionOrderList(
  savedOrder: CharacterSectionOrder | null | undefined
): CharacterSectionId[] {
  const preferredOrder =
    savedOrder?.filter(isCharacterSectionId) ?? DEFAULT_CHARACTER_SECTION_ORDER;

  const ordered: CharacterSectionId[] = [];
  const placed = new Set<CharacterSectionId>();

  for (const id of preferredOrder) {
    if (placed.has(id)) continue;
    ordered.push(id);
    placed.add(id);
  }

  for (const id of DEFAULT_CHARACTER_SECTION_ORDER) {
    if (placed.has(id)) continue;
    ordered.push(id);
    placed.add(id);
  }

  return ordered;
}

export function isDefaultCharacterSectionOrder(
  order: readonly CharacterSectionId[]
): boolean {
  return (
    order.length === DEFAULT_CHARACTER_SECTION_ORDER.length &&
    order.every((id, index) => id === DEFAULT_CHARACTER_SECTION_ORDER[index])
  );
}

export function characterSectionOrdersEqual(
  a: readonly CharacterSectionId[],
  b: readonly CharacterSectionId[]
): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

export function reorderCharacterSectionIds(
  order: readonly CharacterSectionId[],
  draggedId: CharacterSectionId,
  targetId: CharacterSectionId
): CharacterSectionId[] {
  if (draggedId === targetId) return [...order];

  const fromIndex = order.indexOf(draggedId);
  const toIndex = order.indexOf(targetId);
  if (fromIndex === -1 || toIndex === -1) return [...order];

  const next = [...order];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/** API payload for settings saves: default order clears the stored preference. */
export function toPersistedCharacterSectionOrder(
  order: readonly CharacterSectionId[]
): CharacterSectionOrder | null {
  return isDefaultCharacterSectionOrder(order) ? null : [...order];
}
