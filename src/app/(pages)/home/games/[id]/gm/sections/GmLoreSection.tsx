import Button from "@/app/components/shared/Button";
import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import type { ReferenceEntry } from "@/app/lib/types/reference";
import Link from "next/link";
import { GmSectionTitle } from "./GmSectionTitle";

type GmLoreSectionProps = {
  gameId: string;
  onCreateLoreEntry: () => void;
  onEditLoreEntry: (entry: ReferenceEntry) => void;
  onDeleteLoreEntry: (entry: ReferenceEntry) => void;
  deletingEntryId: string | null;
  entries: ReferenceEntry[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

function AccessBadge({ access }: { access: ReferenceEntry["access"] }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        access === "GAME_MASTER"
          ? "border-black/40 bg-black/10 text-black"
          : "border-customPrimary/60 bg-customPrimary/10 text-black"
      }`}
    >
      {access === "GAME_MASTER" ? "GM only" : "Player"}
    </span>
  );
}

export function GmLoreSection({
  gameId,
  onCreateLoreEntry,
  onEditLoreEntry,
  onDeleteLoreEntry,
  deletingEntryId,
  entries,
  loading,
  error,
  onRetry,
}: GmLoreSectionProps) {
  return (
    <InfoCard border>
      <GmSectionTitle>Lore</GmSectionTitle>
      <p className="mt-1 text-sm text-black/70">
        Add campaign lore entries linked to this game.
      </p>
      <div className="mt-3">
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onCreateLoreEntry}
        >
          Add lore entry
        </Button>
      </div>
      <div className="mt-4">
        {loading ? (
          <LoadingState text="Loading lore entries..." />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : entries.length === 0 ? (
          <p className="text-sm text-black/70">No lore entries yet.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-md border border-black/10 bg-paleBlue/50 transition-colors duration-150 hover:bg-paleBlue/70"
              >
                <Link
                  href={`/home/games/${gameId}/lore/${entry.id}`}
                  className="block px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-black">
                      {entry.title}
                    </p>
                    <AccessBadge access={entry.access} />
                  </div>
                  {entry.summary ? (
                    <p className="mt-1 text-xs text-black/70">
                      {entry.summary}
                    </p>
                  ) : null}
                </Link>
                <div className="flex items-center justify-end gap-2 px-3 pb-2">
                  <Button
                    type="button"
                    variant="solidDark"
                    className="text-xs"
                    fullWidth={false}
                    onClick={() => onEditLoreEntry(entry)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="text-xs"
                    fullWidth={false}
                    onClick={() => onDeleteLoreEntry(entry)}
                    disabled={deletingEntryId === entry.id}
                  >
                    {deletingEntryId === entry.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </InfoCard>
  );
}
