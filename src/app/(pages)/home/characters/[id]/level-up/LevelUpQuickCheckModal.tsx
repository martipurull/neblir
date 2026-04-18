"use client";

import Button from "@/app/components/shared/Button";
import { ATTRIBUTE_GROUP_LABELS } from "./constants";

type Props = {
  open: null | "attributes" | "skills";
  onClose: () => void;
  groupedAttributesForDisplay: Map<
    keyof typeof ATTRIBUTE_GROUP_LABELS,
    Array<{ label: string; value: number }>
  >;
  currentSkillsForDisplay: Array<{ label: string; value: number }>;
};

export default function LevelUpQuickCheckModal({
  open,
  onClose,
  groupedAttributesForDisplay,
  currentSkillsForDisplay,
}: Props) {
  if (!open) return null;

  const title = open === "attributes" ? "Current attributes" : "Current skills";
  const maxW =
    open === "attributes" ? "max-w-lg lg:max-w-3xl" : "max-w-lg lg:max-w-xl";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-quickcheck-title"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded border border-black/20 bg-modalBackground-200 shadow-lg ${maxW}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/15 px-4 py-3">
          <h2
            id="level-up-quickcheck-title"
            className="text-base font-semibold text-black"
          >
            {title}
          </h2>
          <Button
            type="button"
            variant="modalCloseLight"
            fullWidth={false}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {open === "attributes" && (
            <div className="bg-transparent p-2">
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  Object.keys(ATTRIBUTE_GROUP_LABELS) as Array<
                    keyof typeof ATTRIBUTE_GROUP_LABELS
                  >
                ).map((groupKey) => {
                  const items = groupedAttributesForDisplay.get(groupKey) ?? [];
                  return (
                    <div
                      key={groupKey}
                      className="rounded border border-black/20 bg-transparent p-2"
                    >
                      <p className="mb-2 text-sm font-semibold text-black">
                        {ATTRIBUTE_GROUP_LABELS[groupKey]}
                      </p>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <div
                            key={`${groupKey}-${item.label}`}
                            className="flex items-center justify-between rounded px-2 py-1 text-sm"
                          >
                            <span className="text-black/80">{item.label}</span>
                            <span className="font-semibold text-black">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {open === "skills" && (
            <div className="space-y-1 overflow-y-auto rounded border border-black/15 bg-transparent p-2">
              {currentSkillsForDisplay.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded px-2 py-1 text-sm"
                >
                  <span className="text-black/80">{item.label}</span>
                  <span className="font-semibold text-black">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
