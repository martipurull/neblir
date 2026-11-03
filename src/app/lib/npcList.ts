import { normalizeOfficialName } from "@/app/lib/officialName";

export const UNGROUPED_NPC_HEADING = "Ungrouped";
export const ARCHIVED_NPC_GROUP = "Archived";

export type NpcListEntry = {
  id: string;
  name: string;
  npcGroup?: string | null;
  hasPlayGrant: boolean;
};

export type NpcListSection<T extends NpcListEntry = NpcListEntry> = {
  heading: string;
  entries: T[];
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

function sortNpcListEntries<T extends NpcListEntry>(
  entries: readonly T[]
): T[] {
  return [...entries].sort((a, b) => {
    if (a.hasPlayGrant !== b.hasPlayGrant) {
      return a.hasPlayGrant ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

/** Sections for the game master page NPC list. Empty sections are omitted. */
export function groupNpcList<T extends NpcListEntry>(
  entries: readonly T[]
): NpcListSection<T>[] {
  const ungrouped: T[] = [];
  const archived: T[] = [];
  const named = new Map<string, { heading: string; entries: T[] }>();

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

  const sections: NpcListSection<T>[] = [];
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
export function npcRollPickerCandidates<T extends { npcGroup?: string | null }>(
  entries: readonly T[]
): T[] {
  return entries.filter((entry) => !isArchivedNpcGroup(entry.npcGroup));
}

export type NpcListVisibility = "all" | "public" | "private";

/** A list entry plus the game link's visibility. Omitted counts as Public. */
export type NpcListViewEntry = NpcListEntry & {
  isPublic?: boolean | null;
};

export type NpcListOpenState = Readonly<Record<string, boolean>>;

export type NpcListViewSection = {
  heading: string;
  /** Key for this tab's open or closed memory. Named groups use their fold key. */
  storageKey: string;
  entries: NpcListViewEntry[];
  filteredCount: number;
  open: boolean;
};

/**
 * Identity for remembering open or closed: Ungrouped, Archived, or a named group's fold key.
 * A new spelling of a named group does not match the previous key, so it starts open.
 */
export function npcListSectionStorageKey(heading: string): string {
  if (isArchivedNpcGroup(heading)) return ARCHIVED_NPC_GROUP;
  const key = npcGroupFoldKey(heading);
  if (key === "") return UNGROUPED_NPC_HEADING;
  return key;
}

function matchesNpcListVisibility(
  entry: NpcListViewEntry,
  visibility: NpcListVisibility
): boolean {
  if (visibility === "all") return true;
  const isPublic = entry.isPublic !== false;
  return visibility === "public" ? isPublic : !isPublic;
}

function sectionIsOpen(heading: string, openByKey: NpcListOpenState): boolean {
  const storageKey = npcListSectionStorageKey(heading);
  return openByKey[storageKey] ?? storageKey !== ARCHIVED_NPC_GROUP;
}

/**
 * Sections for the Game master page NPC list.
 * Visibility cuts cards inside the existing groups. A group with no matches is omitted.
 * A heading with no stored value starts Archived closed and every other group open.
 */
export function viewNpcList(
  entries: readonly NpcListViewEntry[],
  visibility: NpcListVisibility,
  openByKey: NpcListOpenState
): NpcListViewSection[] {
  const filtered = entries.filter((entry) =>
    matchesNpcListVisibility(entry, visibility)
  );

  return groupNpcList(filtered).map((section) => ({
    heading: section.heading,
    storageKey: npcListSectionStorageKey(section.heading),
    entries: section.entries,
    filteredCount: section.entries.length,
    open: sectionIsOpen(section.heading, openByKey),
  }));
}
