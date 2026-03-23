import {
  type CharacterNoteEntry,
  characterNoteEntrySchema,
} from "@/app/lib/types/character";

/** One DB row: JSON envelope so we keep Prisma `notes String[]`. */
export function encodeNoteEntryForDb(entry: CharacterNoteEntry): string {
  return JSON.stringify({
    content: entry.content,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  });
}

/**
 * Parse a single DB string into an entry. Legacy values are plain TipTap JSON or plain text
 * (no envelope); they get placeholder timestamps until the next save.
 */
export function parseNoteStringFromDb(raw: string): CharacterNoteEntry {
  try {
    const o = JSON.parse(raw) as unknown;
    const parsed = characterNoteEntrySchema.safeParse(o);
    if (parsed.success) return parsed.data;
  } catch {
    // not JSON
  }
  const now = new Date().toISOString();
  return { content: raw, createdAt: now, updatedAt: now };
}

export function normalizeNotesFromDb(dbNotes: string[]): CharacterNoteEntry[] {
  return dbNotes.map(parseNoteStringFromDb);
}

export function encodeNotesForDb(entries: CharacterNoteEntry[]): string[] {
  return entries.map(encodeNoteEntryForDb);
}

const noteDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatNoteTimestamp(iso: string): string {
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return "—";
  return noteDateFormatter.format(d);
}
