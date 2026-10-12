import { Button } from "@/app/components/shared/Button";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { SelectField } from "@/app/components/shared/SelectField";
import { TextField } from "@/app/components/shared/TextField";
import { ARCHIVED_NPC_GROUP, isArchivedNpcGroup } from "@/app/lib/npcList";
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
  const namedGroups = groupNames.filter((name) => !isArchivedNpcGroup(name));
  const names =
    currentGroup &&
    !isArchivedNpcGroup(currentGroup) &&
    !namedGroups.includes(currentGroup)
      ? [...namedGroups, currentGroup]
      : namedGroups;
  const selectedGroup = isArchivedNpcGroup(currentGroup)
    ? ARCHIVED_NPC_GROUP
    : (currentGroup ?? "");
  const options = [
    { value: "", label: "Ungrouped" },
    ...names.map((name) => ({ value: name, label: name })),
    { value: ARCHIVED_NPC_GROUP, label: ARCHIVED_NPC_GROUP },
    { value: NEW_GROUP_VALUE, label: "New group…" },
  ];

  return (
    <div>
      <FieldLabel id={selectId} label="NPC group" variant="light" />
      <SelectField
        id={selectId}
        value={creating ? NEW_GROUP_VALUE : selectedGroup}
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
          if ((next ?? "") === selectedGroup) return;
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
