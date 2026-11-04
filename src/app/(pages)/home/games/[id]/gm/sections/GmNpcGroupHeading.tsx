import { Button } from "@/app/components/shared/Button";
import { TextField } from "@/app/components/shared/TextField";
import { useState } from "react";

type GmNpcGroupHeadingProps = {
  heading: string;
  open: boolean;
  filteredCount: number;
  panelId: string;
  disabled: boolean;
  onToggleOpen: () => void;
  onRename?: (from: string, npcGroup: string) => void;
};

export function GmNpcGroupHeading({
  heading,
  open,
  filteredCount,
  panelId,
  disabled,
  onToggleOpen,
  onRename,
}: GmNpcGroupHeadingProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(heading);
  const next = draft.trim();
  const canSave = next !== "" && next !== heading;

  const toggle = (
    <Button
      type="button"
      variant="lightChevronExpand"
      fullWidth={false}
      aria-expanded={open}
      aria-controls={panelId}
      aria-label={
        open ? `Collapse ${heading}` : `Expand ${heading}, ${filteredCount}`
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
              {filteredCount}
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
        if (!canSave || disabled) return;
        onRename(heading, draft);
      }}
    >
      {toggle}
      <TextField
        value={draft}
        density="compact"
        variant="light"
        disabled={disabled}
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
        disabled={disabled || !canSave}
      >
        Save
      </Button>
      <Button
        type="button"
        variant="lightToolbarCompact"
        fullWidth={false}
        disabled={disabled}
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
