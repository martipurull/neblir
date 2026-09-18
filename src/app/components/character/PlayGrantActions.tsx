"use client";

import { Button } from "@/app/components/shared/Button";
import { DangerConfirmModal } from "@/app/components/shared/DangerConfirmModal";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { isGmControlledGameCharacter } from "@/app/lib/gmUtils";
import type { GameDetail } from "@/app/lib/types/game";
import {
  revokeGameCharacterPlayGrant,
  setGameCharacterPlayGrant,
} from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useMemo, useState } from "react";

type PlayGrantActionsProps = {
  game: GameDetail;
  characterId: string;
  onUpdated?: () => void | Promise<void>;
};

export function PlayGrantActions({
  game,
  characterId,
  onUpdated,
}: PlayGrantActionsProps) {
  const link = useMemo(
    () =>
      (game.characters ?? []).find((gc) => gc.character.id === characterId) ??
      null,
    [characterId, game.characters]
  );
  const isGmControlled =
    link != null && isGmControlledGameCharacter(link, game);
  const currentGrant = link?.playGrant ?? null;
  const eligibleOptions = useMemo(
    () =>
      game.users
        .filter((row) => row.userId !== game.gameMaster)
        .map((row) => ({
          value: row.userId,
          label: row.user.name,
        })),
    [game.gameMaster, game.users]
  );

  const [selectedUserId, setSelectedUserId] = useState(
    currentGrant?.userId ?? ""
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  if (game.isGameMaster !== true || !isGmControlled) {
    return null;
  }

  const selectedOption = eligibleOptions.find(
    (opt) => opt.value === selectedUserId
  );
  const selectedIsCurrent = currentGrant?.userId === selectedUserId;
  const canIssue = currentGrant == null && selectedUserId.length > 0;
  const canReplace =
    currentGrant != null && selectedUserId.length > 0 && !selectedIsCurrent;

  const runGrant = async (userId: string) => {
    setBusy(true);
    setError(null);
    try {
      await setGameCharacterPlayGrant(game.id, characterId, userId);
      await onUpdated?.();
      setReplaceOpen(false);
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to issue play grant."));
    } finally {
      setBusy(false);
    }
  };

  const runRevoke = async () => {
    setBusy(true);
    setError(null);
    try {
      await revokeGameCharacterPlayGrant(game.id, characterId);
      setSelectedUserId("");
      await onUpdated?.();
      setRevokeOpen(false);
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to revoke play grant."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 border-t border-white/20 pt-4">
      <p className="text-sm font-semibold text-white">Play grant</p>
      <p className="mt-1 text-xs text-white/75">
        Hand in-play control of this GM-controlled character to one player in
        this game. You keep play control. They do not become an Owner.
      </p>
      {currentGrant ? (
        <p className="mt-2 text-sm text-white/85">
          Current grantee:{" "}
          <span className="font-medium text-white">{currentGrant.name}</span>
        </p>
      ) : (
        <p className="mt-2 text-sm text-white/75">No play grant issued.</p>
      )}

      {eligibleOptions.length === 0 ? (
        <p className="mt-3 text-sm text-neblirWarning-400">
          No eligible players in this game.
        </p>
      ) : (
        <div className="mt-3">
          <SelectDropdown
            id="character-play-grant-grantee"
            label="Player"
            placeholder="Select a player"
            value={selectedUserId}
            options={eligibleOptions}
            onChange={setSelectedUserId}
          />
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {canIssue ? (
          <Button
            type="button"
            variant="modalActionBlock"
            disabled={busy}
            onClick={() => void runGrant(selectedUserId)}
          >
            {busy ? "Issuing..." : "Issue play grant"}
          </Button>
        ) : null}
        {canReplace ? (
          <Button
            type="button"
            variant="modalActionBlock"
            disabled={busy}
            onClick={() => setReplaceOpen(true)}
          >
            Replace play grant
          </Button>
        ) : null}
        {currentGrant ? (
          <Button
            type="button"
            variant="danger"
            disabled={busy}
            onClick={() => setRevokeOpen(true)}
          >
            Revoke play grant
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 text-sm text-neblirDanger-400">{error}</p>
      ) : null}

      <DangerConfirmModal
        isOpen={replaceOpen}
        variant="modalBackground"
        title="Replace play grant?"
        description={
          <>
            {selectedOption?.label ?? "This player"} will replace{" "}
            <strong>{currentGrant?.name ?? "the current grantee"}</strong> as
            the play-grant holder. You keep play control.
          </>
        }
        confirmLabel="Replace grant"
        confirmSubmittingLabel="Replacing..."
        isSubmitting={busy}
        errorMessage={error}
        onCancel={() => {
          if (!busy) setReplaceOpen(false);
        }}
        onConfirm={() => void runGrant(selectedUserId)}
      />
      <DangerConfirmModal
        isOpen={revokeOpen}
        variant="modalBackground"
        title="Revoke play grant?"
        description={
          <>
            This takes play control back from{" "}
            <strong>{currentGrant?.name ?? "the current grantee"}</strong>. The
            character stays in the game.
          </>
        }
        confirmLabel="Revoke grant"
        confirmSubmittingLabel="Revoking..."
        isSubmitting={busy}
        errorMessage={error}
        onCancel={() => {
          if (!busy) setRevokeOpen(false);
        }}
        onConfirm={() => void runRevoke()}
      />
    </div>
  );
}
