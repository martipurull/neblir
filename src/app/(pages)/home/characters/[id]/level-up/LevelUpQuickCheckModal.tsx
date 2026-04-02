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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full rounded border border-black/20 bg-modalBackground-200 p-4 shadow-lg ${
          open === "attributes"
            ? "max-w-lg lg:max-w-3xl"
            : "max-w-lg lg:max-w-xl"
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-black">
            {open === "attributes" && "Current attributes"}
            {open === "skills" && "Current skills"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-black/70 hover:bg-black/10"
          >
            Close
          </button>
        </div>

        {open === "attributes" && (
          <div className="max-h-80 overflow-y-auto bg-transparent p-2 lg:max-h-[75vh]">
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
          <div className="max-h-80 space-y-1 overflow-y-auto rounded border border-black/15 bg-transparent p-2">
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
  );
}
