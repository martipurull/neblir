import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { TextField } from "@/app/components/shared/TextField";
import { ARCHIVED_NPC_GROUP, isArchivedNpcGroup } from "@/app/lib/npcList";
import { useCallback, useEffect, useMemo, useState } from "react";

const NEW_GROUP_VALUE = "\u241fnew";

type GmNpcGroupControlProps = {
  characterId: string;
  characterName: string;
  currentGroup: string | null;
  groupNames: readonly string[];
  disabled: boolean;
  onSetGroup: (npcGroup: string | null) => void;
};

export function GmNpcGroupControl({
  characterId,
  characterName,
  currentGroup,
  groupNames,
  disabled,
  onSetGroup,
}: GmNpcGroupControlProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const groupLabel = currentGroup ?? "Group";
  const accessibleName = currentGroup
    ? `NPC group ${currentGroup}`
    : "NPC group";

  return (
    <div className="flex shrink-0 items-center">
      <Button
        type="button"
        variant="lightNeutralPill"
        fullWidth={false}
        disabled={disabled}
        title={currentGroup ?? undefined}
        aria-label={accessibleName}
        onClick={() => setOpen(true)}
      >
        {groupLabel}
      </Button>
      {open ? (
        <GmNpcGroupModal
          characterId={characterId}
          characterName={characterName}
          currentGroup={currentGroup}
          groupNames={groupNames}
          disabled={disabled}
          onClose={close}
          onSetGroup={onSetGroup}
        />
      ) : null}
    </div>
  );
}

type GmNpcGroupModalProps = {
  characterId: string;
  characterName: string;
  currentGroup: string | null;
  groupNames: readonly string[];
  disabled: boolean;
  onClose: () => void;
  onSetGroup: (npcGroup: string | null) => void;
};

function GmNpcGroupModal({
  characterId,
  characterName,
  currentGroup,
  groupNames,
  disabled,
  onClose,
  onSetGroup,
}: GmNpcGroupModalProps) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const selectId = `npc-group-${characterId}`;
  const selectedGroup = isArchivedNpcGroup(currentGroup)
    ? ARCHIVED_NPC_GROUP
    : (currentGroup ?? "");
  const canAssign = draft.trim() !== "";

  const options = useMemo(() => {
    const namedGroups = groupNames.filter((name) => !isArchivedNpcGroup(name));
    const names =
      currentGroup &&
      !isArchivedNpcGroup(currentGroup) &&
      !namedGroups.includes(currentGroup)
        ? [...namedGroups, currentGroup]
        : namedGroups;
    return [
      { value: "", label: "Ungrouped" },
      ...names.map((name) => ({ value: name, label: name })),
      { value: ARCHIVED_NPC_GROUP, label: ARCHIVED_NPC_GROUP },
      { value: NEW_GROUP_VALUE, label: "New group…" },
    ];
  }, [currentGroup, groupNames]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const assignNewGroup = () => {
    if (!canAssign) return;
    onSetGroup(draft);
    onClose();
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title="NPC group"
      titleId={`npc-group-title-${characterId}`}
      subtitle={characterName}
      maxWidthClass="max-w-sm"
      footer={
        <div className="flex justify-end">
          <Button
            type="button"
            variant="modalFooterSecondary"
            fullWidth={false}
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      }
    >
      <div className={menuOpen ? "min-h-[19rem]" : undefined}>
        <SelectDropdown
          id={selectId}
          label="NPC group"
          showLabel={false}
          placeholder="Ungrouped"
          value={creating ? NEW_GROUP_VALUE : selectedGroup}
          options={options}
          disabled={disabled}
          sortOptions={false}
          onOpenChange={setMenuOpen}
          onChange={(value) => {
            if (value === NEW_GROUP_VALUE) {
              setCreating(true);
              return;
            }
            setCreating(false);
            setDraft("");
            const next = value === "" ? null : value;
            if ((next ?? "") === selectedGroup) {
              onClose();
              return;
            }
            onSetGroup(next);
            onClose();
          }}
        />
      </div>
      {creating ? (
        <div className="mt-3 flex items-center gap-2">
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
              assignNewGroup();
            }}
          />
          <Button
            type="button"
            variant="solidDark"
            fullWidth={false}
            className="shrink-0 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || !canAssign}
            onClick={assignNewGroup}
          >
            Assign
          </Button>
        </div>
      ) : null}
    </ModalShell>
  );
}
