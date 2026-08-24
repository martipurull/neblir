"use client";

import { Button } from "@/app/components/shared/Button";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { updateCharacterHealth } from "@/lib/api/character";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { Status } from "@prisma/client";
import { useState } from "react";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "ALIVE", label: "Alive" },
  { value: "DECEASED", label: "Deceased" },
  { value: "DERANGED", label: "Deranged" },
];

function statusToneClassName(status: Status): string {
  switch (status) {
    case "ALIVE":
      return "text-neblirSafe-600";
    case "DERANGED":
      return "text-neblirWarning-600";
    case "DECEASED":
      return "text-neblirDanger-600";
  }
}

function statusDisplayLabel(status: Status): string {
  return (
    STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    String(status).replace(/_/g, " ").toLowerCase()
  );
}

type CharacterStatusFieldProps = {
  characterId: string;
  status: Status;
  editable: boolean;
  disabled?: boolean;
  mutate: () => Promise<unknown>;
};

export function CharacterStatusField({
  characterId,
  status,
  editable,
  disabled = false,
  mutate,
}: CharacterStatusFieldProps) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (editable && editing) {
    return (
      <li className="space-y-2 py-3">
        <SelectDropdown
          id="character-status"
          label="Status"
          placeholder="Select status"
          value={status}
          options={STATUS_OPTIONS}
          disabled={disabled || busy}
          onChange={(value) => {
            void (async () => {
              setBusy(true);
              setError(null);
              try {
                await updateCharacterHealth(characterId, {
                  status: value as Status,
                });
                await mutate();
                setEditing(false);
              } catch (err) {
                setError(getUserSafeErrorMessage(err));
              } finally {
                setBusy(false);
              }
            })();
          }}
        />
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondaryOutlineXs"
            disabled={busy}
            onClick={() => {
              setError(null);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
        {error ? (
          <p className="text-sm text-neblirDanger-600">{error}</p>
        ) : null}
      </li>
    );
  }

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3">
      <span className="flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-widest text-black">
        <span className="h-3 w-px bg-black" aria-hidden />
        Status
      </span>
      <span
        className={`text-center text-base font-semibold capitalize ${statusToneClassName(status)}`}
      >
        {statusDisplayLabel(status)}
      </span>
      {editable ? (
        <Button
          type="button"
          variant="secondaryOutlineXs"
          disabled={disabled || busy}
          onClick={() => {
            setError(null);
            setEditing(true);
          }}
        >
          Edit
        </Button>
      ) : (
        <span className="w-0" aria-hidden />
      )}
      {error ? (
        <p className="col-span-3 text-right text-sm text-neblirDanger-600">
          {error}
        </p>
      ) : null}
    </li>
  );
}
