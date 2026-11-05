import { Button } from "@/app/components/shared/Button";
import { TextField } from "@/app/components/shared/TextField";
import type { StashRename } from "@/app/lib/stashPlace";
import { useState } from "react";

type StashDrawerHeadingProps = {
  heading: string;
  open: boolean;
  holdingCount: number;
  panelId: string;
  disabled: boolean;
  onToggleOpen: () => void;
  onRename?: (rename: StashRename) => Promise<void>;
};

export function StashDrawerHeading({
  heading,
  open,
  holdingCount,
  panelId,
  disabled,
  onToggleOpen,
  onRename,
}: StashDrawerHeadingProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(heading);
  const [saving, setSaving] = useState(false);
  const trimmedDraft = draft.trim();
  const canSave = trimmedDraft !== heading;

  const toggle = (
    <Button
      type="button"
      variant="lightChevronExpand"
      fullWidth={false}
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={
        open ? `Collapse ${heading}` : `Expand ${heading}, ${holdingCount}`
      }
      onClick={onToggleOpen}
    >
      <span aria-hidden="true">{open ? "▾" : "▸"}</span>
    </Button>
  );

  if (!onRename || !editing) {
    return (
      <div className="flex items-center gap-2">
        {toggle}
        <h3 className="text-sm font-semibold text-black">
          {heading}
          {open ? null : (
            <span className="ml-2 font-medium text-black/60">
              {holdingCount}
            </span>
          )}
        </h3>
        {onRename ? (
          <Button
            type="button"
            variant="lightToolbarCompact"
            fullWidth={false}
            disabled={disabled}
            onClick={() => {
              setDraft(heading);
              setEditing(true);
            }}
          >
            Rename
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave || disabled || saving) return;
        setSaving(true);
        void onRename({ from: heading, placeName: draft })
          .then(() => setEditing(false))
          .catch(() => {
            // The inventory section shows the message and leaves this draft open.
          })
          .finally(() => setSaving(false));
      }}
    >
      {toggle}
      <TextField
        value={draft}
        density="compact"
        variant="light"
        disabled={disabled || saving}
        aria-label={`Rename ${heading}`}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setDraft(heading);
          setEditing(false);
        }}
      />
      <Button
        type="submit"
        variant="solidDark"
        fullWidth={false}
        className="shrink-0 text-sm"
        disabled={disabled || saving || !canSave}
      >
        Save
      </Button>
      <Button
        type="button"
        variant="lightToolbarCompact"
        fullWidth={false}
        disabled={disabled || saving}
        onClick={() => {
          setDraft(heading);
          setEditing(false);
        }}
      >
        Cancel
      </Button>
    </form>
  );
}
