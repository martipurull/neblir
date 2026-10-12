import { normalizeOfficialName } from "@/app/lib/officialName";

export const UNGROUPED_NPC_HEADING = "Ungrouped";

export type NpcListEntry = {
  id: string;
  name: string;
  npcGroup?: string | null;
  hasPlayGrant: boolean;
};

export type NpcListSection = {
  heading: string;
  entries: NpcListEntry[];
};

const ungroupedKey = normalizeOfficialName(UNGROUPED_NPC_HEADING);

/** Fold key for an NPC group. Blank and the word Ungrouped are Ungrouped. */
function npcGroupFoldKey(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? "";
  if (trimmed === "") return "";
  const key = normalizeOfficialName(trimmed);
  if (key === "" || key === ungroupedKey) return "";
  return key;
}

/**
 * Name to store on the game link. Blank and Ungrouped store nothing.
 * A later spelling of an existing group keeps the first spelling.
 */
export function npcGroupNameToStore(
  candidate: string | null,
  existingSpellings: readonly string[]
): string | null {
  const trimmed = candidate?.trim() ?? "";
  const key = npcGroupFoldKey(trimmed);
  if (key === "") return null;
  const existing = existingSpellings.find(
    (spelling) => npcGroupFoldKey(spelling) === key
  );
  return existing ?? trimmed;
}

function sortNpcListEntries(entries: readonly NpcListEntry[]): NpcListEntry[] {
  return [...entries].sort((a, b) => {
    if (a.hasPlayGrant !== b.hasPlayGrant) {
      return a.hasPlayGrant ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

/** Sections for the game master page NPC list. Empty sections are omitted. */
export function groupNpcList(
  entries: readonly NpcListEntry[]
): NpcListSection[] {
  const ungrouped: NpcListEntry[] = [];
  const named = new Map<string, { heading: string; entries: NpcListEntry[] }>();

  for (const entry of entries) {
    const trimmed = entry.npcGroup?.trim() ?? "";
    const key = npcGroupFoldKey(trimmed);
    if (key === "") {
      ungrouped.push(entry);
      continue;
    }
    const bucket = named.get(key);
    if (bucket) {
      bucket.entries.push(entry);
    } else {
      named.set(key, { heading: trimmed, entries: [entry] });
    }
  }

  const namedSections = [...named.values()]
    .sort((a, b) =>
      a.heading.localeCompare(b.heading, undefined, { sensitivity: "base" })
    )
    .map((bucket) => ({
      heading: bucket.heading,
      entries: sortNpcListEntries(bucket.entries),
    }));

  const sections: NpcListSection[] = [];
  if (ungrouped.length > 0) {
    sections.push({
      heading: UNGROUPED_NPC_HEADING,
      entries: sortNpcListEntries(ungrouped),
    });
  }
  sections.push(...namedSections);
  return sections;
}
