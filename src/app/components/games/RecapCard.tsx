import Button from "@/app/components/shared/Button";
import type { GameRecap } from "@/app/lib/types/recap";

type RecapCardProps = {
  recap: GameRecap;
  onDownload: (recapId: string) => void;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: (recap: GameRecap) => void;
};

export default function RecapCard({
  recap,
  onDownload,
  canDelete = false,
  deleting = false,
  onDelete,
}: RecapCardProps) {
  return (
    <li className="rounded-md border border-black/10 bg-paleBlue/40 px-3 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-black">
          {recap.title}
        </p>
        <p className="truncate text-xs text-black/70">
          {new Date(recap.createdAt).toLocaleDateString()} • {recap.fileName}
        </p>
        {recap.summary ? (
          <p className="mt-1 text-xs text-black/80">{recap.summary}</p>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          variant="solidDark"
          fullWidth={false}
          className="text-xs"
          onClick={() => onDownload(recap.id)}
        >
          Download
        </Button>
        {canDelete ? (
          <Button
            type="button"
            variant="danger"
            className="text-xs"
            fullWidth={false}
            disabled={deleting}
            onClick={() => onDelete?.(recap)}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        ) : null}
      </div>
    </li>
  );
}
