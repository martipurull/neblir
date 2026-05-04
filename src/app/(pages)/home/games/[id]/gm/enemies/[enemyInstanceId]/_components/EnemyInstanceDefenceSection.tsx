"use client";

import Button from "@/app/components/shared/Button";

type DefenceRow = { key: string; title: string; dice: number };

type EnemyInstanceDefenceSectionProps = {
  rows: DefenceRow[];
  onOpenModal: (row: DefenceRow) => void;
};

export function EnemyInstanceDefenceSection({
  rows,
  onOpenModal,
}: EnemyInstanceDefenceSectionProps) {
  if (rows.length === 0) return null;
  return (
    <section className="rounded border border-black/20 p-4">
      <h2 className="text-sm font-semibold text-black">Defence rolls</h2>
      <p className="mt-1 text-xs text-black/65">
        Uses defence dice as d10 pool. Rolling spends one reaction when enabled
        below.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {rows.map((r) => (
          <Button
            key={r.key}
            type="button"
            variant="secondaryOutlineXs"
            fullWidth={false}
            onClick={() => onOpenModal(r)}
          >
            {r.title} ({r.dice}d10)
          </Button>
        ))}
      </div>
    </section>
  );
}
