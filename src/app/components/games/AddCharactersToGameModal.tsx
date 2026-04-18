"use client";

import React, { useMemo, useState } from "react";
import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { useCharacters } from "@/hooks/use-characters";
import { useImageUrls } from "@/hooks/use-image-urls";
import {
  getUserSafeApiError,
  getUserSafeErrorMessage,
} from "@/lib/userSafeError";

type AddCharactersResponse = {
  success: boolean;
  linkedCount: number;
  linkedIds: string[];
  alreadyLinkedIds: string[];
  failed: Array<{ characterId: string; reason: string }>;
};

type AddCharactersToGameModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  alreadyLinkedCharacterIds: string[];
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AddCharactersToGameModal({
  isOpen,
  gameId,
  gameName,
  alreadyLinkedCharacterIds,
  onClose,
  onSuccess,
}: AddCharactersToGameModalProps) {
  const { characters, loading, error, refetch } = useCharacters();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] =
    useState<AddCharactersResponse | null>(null);

  const alreadyLinked = useMemo(
    () => new Set(alreadyLinkedCharacterIds),
    [alreadyLinkedCharacterIds]
  );

  const imageEntries = useMemo(
    () =>
      characters.map((c) => ({
        id: c.id,
        imageKey: c.avatarKey ?? undefined,
      })),
    [characters]
  );
  const imageUrls = useImageUrls(imageEntries);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter((c) =>
      `${c.name} ${c.surname ?? ""}`.toLowerCase().includes(q)
    );
  }, [characters, query]);

  const characterNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of characters) {
      m.set(c.id, `${c.name}${c.surname ? ` ${c.surname}` : ""}`);
    }
    return m;
  }, [characters]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const closeAndReset = () => {
    setQuery("");
    setSelected(new Set());
    setSubmitting(false);
    setSubmitError(null);
    setSubmitResult(null);
    onClose();
  };

  const handleSubmit = async () => {
    const ids = Array.from(selected).filter((id) => !alreadyLinked.has(id));
    if (ids.length === 0) {
      setSubmitError(
        "Select at least one character that isn't already linked."
      );
      return;
    }
    setSubmitError(null);
    setSubmitResult(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/characters`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterIds: ids }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(
          getUserSafeApiError(
            res.status,
            data as { message?: string; details?: string },
            "Failed to add characters."
          )
        );
        return;
      }
      const payload = data as AddCharactersResponse;
      setSubmitResult(payload);

      if (payload.linkedCount > 0 || payload.alreadyLinkedIds.length > 0) {
        onSuccess?.();
      }

      // Remove processed IDs from the selection so the user can retry failures.
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of payload.linkedIds) next.delete(id);
        for (const id of payload.alreadyLinkedIds) next.delete(id);
        return next;
      });

      // If everything succeeded (or was already linked), close; otherwise keep open and show details.
      if (payload.failed.length === 0) {
        closeAndReset();
      }
    } catch (e) {
      setSubmitError(getUserSafeErrorMessage(e, "Failed to add characters."));
    } finally {
      setSubmitting(false);
    }
  };

  const selectableCount = characters.filter(
    (c) => !alreadyLinked.has(c.id)
  ).length;

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={closeAndReset}
      title={`Add characters to ${gameName}`}
      titleId="add-characters-title"
      subtitle="Select one or more of your characters to link to this game."
      closeDisabled={submitting}
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="modalFooterSecondary"
            fullWidth={false}
            className="font-medium"
            onClick={closeAndReset}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="modalFooterPrimary"
            fullWidth={false}
            className="!text-modalBackground-200"
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? "Adding..." : "Add to game"}
          </Button>
        </div>
      }
    >
      <>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your characters..."
            className="min-w-0 flex-1 rounded border-2 border-white bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Search characters"
            disabled={submitting}
          />
          <Button
            type="button"
            variant="modalToolbarAction"
            fullWidth={false}
            onClick={() => void refetch()}
            disabled={submitting}
          >
            Refresh
          </Button>
        </div>

        {error && <p className="mt-3 text-sm text-neblirDanger-400">{error}</p>}

        <div className="mt-3 max-h-72 overflow-y-auto rounded border border-white/30 bg-paleBlue/5 p-2">
          {loading ? (
            <p className="p-2 text-sm text-white/80">Loading characters...</p>
          ) : filtered.length === 0 ? (
            <p className="p-2 text-sm text-white/80">No characters found.</p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((c) => {
                const name = `${c.name}${c.surname ? ` ${c.surname}` : ""}`;
                const isLinked = alreadyLinked.has(c.id);
                const checked = selected.has(c.id);
                const avatarUrl = c.avatarKey
                  ? (imageUrls[c.id] ?? undefined)
                  : null;
                const initials =
                  c.name.charAt(0).toUpperCase() +
                  (c.surname?.charAt(0).toUpperCase() ?? "");

                return (
                  <li key={c.id}>
                    <label
                      className={[
                        "flex items-center gap-3 rounded-md border border-white/20 px-3 py-2 text-white",
                        isLinked ? "opacity-60" : "hover:bg-paleBlue/10",
                      ].join(" ")}
                    >
                      <Checkbox
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        disabled={submitting || isLinked}
                        tone="inverse"
                        label={<span className="sr-only">{name}</span>}
                        className="shrink-0"
                      />
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/30 bg-paleBlue/10">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarUrl}
                            alt=""
                            className="h-full w-full object-cover object-top"
                          />
                        ) : avatarUrl === undefined ? (
                          <ImageLoadingSkeleton variant="avatar" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/90">
                            {initials}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{name}</p>
                        <p className="mt-0.5 text-xs text-white/75">
                          Level {c.level} • {c.paths.join(", ")}
                          {isLinked ? " • Already linked" : ""}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selectableCount === 0 && !loading && !error && (
          <p className="mt-3 text-sm text-white/80">
            All of your characters are already linked to this game.
          </p>
        )}

        {submitResult && (
          <div className="mt-3 rounded border border-white/30 bg-black/20 p-3 text-sm text-white">
            {submitResult.linkedIds.length > 0 && (
              <p className="font-medium text-neblirSafe-400">
                Added:{" "}
                {submitResult.linkedIds
                  .map((id) => characterNameById.get(id) ?? id)
                  .join(", ")}
              </p>
            )}
            {submitResult.alreadyLinkedIds.length > 0 && (
              <p className="mt-1 text-white/90">
                Already linked:{" "}
                {submitResult.alreadyLinkedIds
                  .map((id) => characterNameById.get(id) ?? id)
                  .join(", ")}
              </p>
            )}
            {submitResult.failed.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-neblirDanger-400">
                  Couldn&apos;t add:
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-white/90">
                  {submitResult.failed.map((f) => (
                    <li key={f.characterId}>
                      {(characterNameById.get(f.characterId) ?? f.characterId) +
                        (f.reason ? ` — ${f.reason}` : "")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {submitError && (
          <p className="mt-3 text-sm text-neblirDanger-400">{submitError}</p>
        )}
      </>
    </ModalShell>
  );
}
