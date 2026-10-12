import { normalizeOfficialName } from "@/app/lib/officialName";

export const UNGROUPED_NPC_HEADING = "Ungrouped";
export const ARCHIVED_NPC_GROUP = "Archived";

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
const archivedKey = normalizeOfficialName(ARCHIVED_NPC_GROUP);

/** Fold key for an NPC group. Blank and the word Ungrouped are Ungrouped. */
function npcGroupFoldKey(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? "";
  if (trimmed === "") return "";
  const key = normalizeOfficialName(trimmed);
  if (key === "" || key === ungroupedKey) return "";
  return key;
}

/** Any capitalisation or spacing of the reserved Archived group. */
export function isArchivedNpcGroup(name: string | null | undefined): boolean {
  return npcGroupFoldKey(name) === archivedKey;
}

/**
 * Name to store on the game link. Blank and Ungrouped store nothing.
 * A later spelling of an existing group keeps the first spelling.
 * Archived, in any capitalisation, is stored as Archived.
 */
export function npcGroupNameToStore(
  candidate: string | null,
  existingSpellings: readonly string[]
): string | null {
  const trimmed = candidate?.trim() ?? "";
  const key = npcGroupFoldKey(trimmed);
  if (key === "") return null;
  if (key === archivedKey) return ARCHIVED_NPC_GROUP;
  const existing = existingSpellings.find(
    (spelling) => npcGroupFoldKey(spelling) === key
  );
  return existing ?? trimmed;
}

export type NpcGroupRenameLink = {
  id: string;
  npcGroup: string | null;
};

export type ResolvedNpcGroupRename =
  | { ok: true; npcGroup: string; linkIds: string[] }
  | {
      ok: false;
      reason: "not_a_group" | "missing" | "ungrouped" | "reserved";
    };

/**
 * Links whose group matches `from`, and the name to store.
 * A new spelling of this group is kept as typed. Joining another group keeps that group's spelling.
 */
export function resolveNpcGroupRename(
  links: readonly NpcGroupRenameLink[],
  from: string,
  to: string
): ResolvedNpcGroupRename {
  if (isArchivedNpcGroup(from) || isArchivedNpcGroup(to)) {
    return { ok: false, reason: "reserved" };
  }

  const fromKey = npcGroupFoldKey(from);
  if (fromKey === "") return { ok: false, reason: "not_a_group" };

  const matching = links.filter(
    (link) => npcGroupFoldKey(link.npcGroup) === fromKey
  );
  if (matching.length === 0) return { ok: false, reason: "missing" };

  const otherSpellings = links.flatMap((link) => {
    if (!link.npcGroup) return [];
    if (npcGroupFoldKey(link.npcGroup) === fromKey) return [];
    return [link.npcGroup];
  });
  const stored = npcGroupNameToStore(to, otherSpellings);
  if (stored === null) return { ok: false, reason: "ungrouped" };

  return {
    ok: true,
    npcGroup: stored,
    linkIds: matching.map((link) => link.id),
  };
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
  const archived: NpcListEntry[] = [];
  const named = new Map<string, { heading: string; entries: NpcListEntry[] }>();

  for (const entry of entries) {
    const trimmed = entry.npcGroup?.trim() ?? "";
    const key = npcGroupFoldKey(trimmed);
    if (key === "") {
      ungrouped.push(entry);
      continue;
    }
    if (key === archivedKey) {
      archived.push(entry);
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
  if (archived.length > 0) {
    sections.push({
      heading: ARCHIVED_NPC_GROUP,
      entries: sortNpcListEntries(archived),
    });
  }
  return sections;
}

/** Flat initiative roll-picker list. Characters in Archived are omitted. */
export function npcRollPickerCandidates(
  entries: readonly NpcListEntry[]
): NpcListEntry[] {
  return entries.filter((entry) => !isArchivedNpcGroup(entry.npcGroup));
}
