import { Button } from "@/app/components/shared/Button";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { SelectField } from "@/app/components/shared/SelectField";
import { TextField } from "@/app/components/shared/TextField";
import { useState } from "react";

const NEW_GROUP_VALUE = "\u241fnew";

type GmNpcGroupFieldProps = {
  characterId: string;
  currentGroup: string | null;
  groupNames: readonly string[];
  disabled: boolean;
  onSetGroup: (npcGroup: string | null) => void;
};

export function GmNpcGroupField({
  characterId,
  currentGroup,
  groupNames,
  disabled,
  onSetGroup,
}: GmNpcGroupFieldProps) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const selectId = `npc-group-${characterId}`;
  const names =
    currentGroup && !groupNames.includes(currentGroup)
      ? [...groupNames, currentGroup]
      : groupNames;
  const options = [
    { value: "", label: "Ungrouped" },
    ...names.map((name) => ({ value: name, label: name })),
    { value: NEW_GROUP_VALUE, label: "New group…" },
  ];

  return (
    <div>
      <FieldLabel id={selectId} label="NPC group" variant="light" />
      <SelectField
        id={selectId}
        value={creating ? NEW_GROUP_VALUE : (currentGroup ?? "")}
        disabled={disabled}
        options={options}
        onChange={(value) => {
          if (value === NEW_GROUP_VALUE) {
            setCreating(true);
            return;
          }
          setCreating(false);
          setDraft("");
          const next = value === "" ? null : value;
          if (next === currentGroup) return;
          onSetGroup(next);
        }}
      />
      {creating ? (
        <div className="mt-2 flex items-center gap-2">
          <TextField
            id={`npc-group-new-${characterId}`}
            value={draft}
            density="compact"
            variant="light"
            placeholder="Group name"
            disabled={disabled}
            aria-label="New NPC group"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              if (draft.trim() === "") return;
              onSetGroup(draft);
            }}
          />
          <Button
            type="button"
            variant="solidDark"
            fullWidth={false}
            className="shrink-0 text-sm"
            disabled={disabled || draft.trim() === ""}
            onClick={() => onSetGroup(draft)}
          >
            Assign
          </Button>
        </div>
      ) : null}
    </div>
  );
}
