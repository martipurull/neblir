import { Button } from "@/app/components/shared/Button";
import { TextField } from "@/app/components/shared/TextField";
import { useState } from "react";

type GmNpcGroupHeadingProps = {
  heading: string;
  disabled: boolean;
  onRename?: (from: string, npcGroup: string) => void;
};

export function GmNpcGroupHeading({
  heading,
  disabled,
  onRename,
}: GmNpcGroupHeadingProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(heading);
  const next = draft.trim();
  const canSave = next !== "" && next !== heading;

  if (!onRename || !editing) {
    return (
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-black">{heading}</h3>
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
