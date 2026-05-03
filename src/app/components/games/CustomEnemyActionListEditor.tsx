"use client";

import Button from "@/app/components/shared/Button";
import { ModalFieldLabel } from "@/app/components/games/shared/ModalFieldLabel";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import {
  ModalSelect,
  type ModalSelectOption,
} from "@/app/components/games/shared/ModalSelect";
import { RichTextToolbar } from "@/app/components/shared/RichTextToolbar";
import {
  GENERAL_INFORMATION_RICH_TEXT_EXTENSIONS,
  normalizeStoredHtmlForEditor,
  serializeEditorToStoredHtml,
} from "@/app/lib/tiptap/generalInformationRichText";
import { modalInputClass } from "@/app/components/games/shared/modalStyles";
import type { CustomEnemyActionDraft } from "@/app/components/games/useCreateCustomEnemyModal";
import { weaponDamageTypeSchema } from "@/app/lib/types/item";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";

export const DAMAGE_TYPE_OPTIONS: ModalSelectOption[] = [
  { value: "", label: "None" },
  ...weaponDamageTypeSchema.options.map((v) => ({
    value: v,
    label: v.replace(/_/g, " "),
  })),
];

type WhichList = "actions" | "additionalActions";

type CustomEnemyActionListEditorProps = {
  which: WhichList;
  title: string;
  hint?: string;
  rows: CustomEnemyActionDraft[];
  disabled: boolean;
  onAdd: () => void;
  onRemove: (clientId: string) => void;
  onChange: (
    clientId: string,
    field: Exclude<keyof CustomEnemyActionDraft, "clientId">,
    value: string
  ) => void;
};

type ActionDescriptionRichTextProps = {
  id: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
};

function ActionDescriptionRichText({
  id,
  value,
  disabled,
  onChange,
}: ActionDescriptionRichTextProps) {
  const editor = useEditor({
    extensions: GENERAL_INFORMATION_RICH_TEXT_EXTENSIONS,
    content: normalizeStoredHtmlForEditor(value),
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "outline-none text-sm text-white leading-relaxed focus:outline-none caret-white selection:bg-paleBlue/25 selection:text-black",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(serializeEditorToStoredHtml(ed.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div
      id={id}
      className="character-note-html rounded border-2 border-white/50 bg-transparent px-3 py-2 text-white shadow-sm [&_.ProseMirror]:min-h-[7rem] [&_.ProseMirror]:text-sm [&_.ProseMirror]:outline-none [&_.ProseMirror_a]:text-white [&_.ProseMirror_a]:underline"
    >
      {editor ? (
        <>
          <RichTextToolbar editor={editor} />
          <EditorContent editor={editor} />
        </>
      ) : (
        <p className="text-sm text-white/70">Loading editor...</p>
      )}
    </div>
  );
}

export function CustomEnemyActionListEditor({
  which,
  title,
  hint,
  rows,
  disabled,
  onAdd,
  onRemove,
  onChange,
}: CustomEnemyActionListEditorProps) {
  return (
    <section>
      <div className="mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          {hint ? <p className="mt-0.5 text-xs text-white/55">{hint}</p> : null}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-white/60">
          None yet. Use the button above to add one.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => {
            const prefix = `${which}-${row.clientId}`;
            return (
              <li
                key={row.clientId}
                className="rounded border border-white/20 bg-black/25 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-white/70">
                    {which === "actions" ? "Action" : "Additional"} {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="semanticDangerOutline"
                    fullWidth={false}
                    disabled={disabled}
                    className="!px-2 !py-1 !text-xs"
                    onClick={() => onRemove(row.clientId)}
                  >
                    Remove
                  </Button>
                </div>
                <div className="space-y-2">
                  <div>
                    <ModalFieldLabel
                      id={`${prefix}-name`}
                      label="Action name"
                      required
                    />
                    <input
                      id={`${prefix}-name`}
                      type="text"
                      value={row.name}
                      onChange={(e) =>
                        onChange(row.clientId, "name", e.target.value)
                      }
                      className={modalInputClass}
                      disabled={disabled}
                      placeholder="e.g. Bite"
                    />
                  </div>
                  <div>
                    <ModalFieldLabel
                      id={`${prefix}-description`}
                      label="Description"
                    />
                    <ActionDescriptionRichText
                      id={`${prefix}-description`}
                      value={row.description}
                      onChange={(value) =>
                        onChange(row.clientId, "description", value)
                      }
                      disabled={disabled}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <ModalNumberField
                      id={`${prefix}-to-hit-dice-count`}
                      label="# d10 to hit"
                      value={row.numberOfDiceToHit}
                      onChange={(v) =>
                        onChange(row.clientId, "numberOfDiceToHit", v)
                      }
                      disabled={disabled}
                      required={false}
                      min={1}
                      step={1}
                    />
                    <ModalNumberField
                      id={`${prefix}-damage-dice-count`}
                      label="# damage dice"
                      value={row.numberOfDamageDice}
                      onChange={(v) =>
                        onChange(row.clientId, "numberOfDamageDice", v)
                      }
                      disabled={disabled}
                      required={false}
                      min={1}
                      step={1}
                    />
                  </div>
                  <p className="text-xs text-white/55">
                    To-hit rolls always use d10, so only the number of d10 is
                    needed.
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <ModalNumberField
                      id={`${prefix}-damage-die-size`}
                      label="Damage die size"
                      value={row.damageDiceType}
                      onChange={(v) =>
                        onChange(row.clientId, "damageDiceType", v)
                      }
                      disabled={disabled}
                      required={false}
                      min={1}
                      placeholder="e.g. 6 for d6"
                      step={1}
                    />
                  </div>
                  <ModalSelect
                    id={`${prefix}-damage`}
                    label="Damage type"
                    placeholder="None"
                    value={row.damageType}
                    options={DAMAGE_TYPE_OPTIONS}
                    disabled={disabled}
                    onChange={(v) => onChange(row.clientId, "damageType", v)}
                  />
                  <div>
                    <ModalFieldLabel
                      id={`${prefix}-notes`}
                      label="Action notes"
                    />
                    <textarea
                      id={`${prefix}-notes`}
                      value={row.notes}
                      onChange={(e) =>
                        onChange(row.clientId, "notes", e.target.value)
                      }
                      className={modalInputClass + " min-h-[48px]"}
                      rows={2}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-3">
        <Button
          type="button"
          variant="secondaryOutlineXs"
          fullWidth
          disabled={disabled}
          className="sm:!w-auto"
          onClick={onAdd}
        >
          Add {which === "actions" ? "action" : "additional action"}
        </Button>
      </div>
    </section>
  );
}
