"use client";

import { RichTextField } from "@/app/components/shared/RichTextField";
import { StoredRichTextHtml } from "@/app/components/shared/StoredRichTextHtml";
import { Button } from "@/app/components/shared/Button";
import type { GameDetail } from "@/app/lib/types/game";
import { serializeEditorToStoredHtml } from "@/app/lib/tiptap/richText";
import { updateGame } from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useCallback, useState } from "react";

type GmPremiseSectionProps = {
  gameId: string;
  premise: string | null | undefined;
  onUpdated: (game: GameDetail) => void | Promise<void>;
};

function optionalPremiseHtml(html: string): string | null {
  const trimmed = html.trim();
  if (!trimmed) return null;
  const persisted = serializeEditorToStoredHtml(trimmed);
  return persisted || null;
}

export function GmPremiseSection({
  gameId,
  premise,
  onUpdated,
}: GmPremiseSectionProps) {
  const savedPremise = premise ?? "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(savedPremise);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPremise = Boolean(savedPremise.trim());

  const startEditing = useCallback(() => {
    setDraft(savedPremise);
    setError(null);
    setEditing(true);
  }, [savedPremise]);

  const cancelEditing = useCallback(() => {
    setDraft(savedPremise);
    setError(null);
    setEditing(false);
  }, [savedPremise]);

  const savePremise = useCallback(async () => {
    setError(null);
    setSaving(true);
    try {
      const normalized = optionalPremiseHtml(draft);
      const updated = await updateGame(gameId, { premise: normalized });
      await onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(getUserSafeErrorMessage(err, "Failed to save premise"));
    } finally {
      setSaving(false);
    }
  }, [draft, gameId, onUpdated]);

  return (
    <div className="rounded-md border border-black p-4">
      <span className="text-sm font-semibold text-black">Premise</span>
      <p className="mt-1 text-xs text-black/70">
        Shown on the game page and games list. Locked by default—unlock to edit.
      </p>

      <div className="mt-3">
        {editing ? (
          <>
            <RichTextField
              id="gm-game-premise"
              value={draft}
              onChange={setDraft}
              onBlur={() => undefined}
              minHeightClass="min-h-36"
              editorContentClassName="max-h-80 overflow-y-auto overflow-x-hidden overscroll-y-contain"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="primarySm"
                fullWidth={false}
                disabled={saving}
                onClick={() => void savePremise()}
              >
                {saving ? "Saving…" : "Save premise"}
              </Button>
              <Button
                type="button"
                variant="secondaryOutlineXs"
                fullWidth={false}
                disabled={saving}
                onClick={cancelEditing}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-sm border border-black/10 bg-paleBlue/20 px-3 py-2">
              {hasPremise ? (
                <StoredRichTextHtml
                  content={savedPremise}
                  className="text-sm text-black/80"
                />
              ) : (
                <p className="text-sm italic text-black/50">No premise set.</p>
              )}
            </div>
            <div className="mt-3">
              <Button
                type="button"
                variant="primarySm"
                fullWidth={false}
                onClick={startEditing}
              >
                Edit premise
              </Button>
            </div>
          </>
        )}
      </div>

      {error ? (
        <p className="mt-2 text-sm text-neblirDanger-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
