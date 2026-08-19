import { Button } from "@/app/components/shared/Button";
import { FileKindThumbnail } from "@/app/components/shared/FileKindThumbnail";
import type { GameRecap } from "@/app/lib/types/recap";

type RecapCardProps = {
  recap: GameRecap;
  onOpen: (recapId: string) => void;
  onDownload: (recapId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  deleting?: boolean;
  onEdit?: (recap: GameRecap) => void;
  onDelete?: (recap: GameRecap) => void;
};

export function RecapCard({
  recap,
  onOpen,
  onDownload,
  canEdit = false,
  canDelete = false,
  deleting = false,
  onEdit,
  onDelete,
}: RecapCardProps) {
  return (
    <li className="flex gap-3 rounded-md border border-black/10 bg-paleBlue/40 p-3">
      <FileKindThumbnail kind="PDF" title={recap.title} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-black">
          {recap.title}
        </p>
        <p className="truncate text-xs text-black/70">
          {new Date(recap.createdAt).toLocaleDateString()} • {recap.fileName}
        </p>
        {recap.summary ? (
          <p className="mt-1 text-xs text-black/80">{recap.summary}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="solidDark"
            fullWidth={false}
            className="text-xs"
            onClick={() => onOpen(recap.id)}
          >
            Open
          </Button>
          <Button
            type="button"
            variant="solidDark"
            fullWidth={false}
            className="text-xs"
            onClick={() => onDownload(recap.id)}
          >
            Download
          </Button>
          {canEdit ? (
            <Button
              type="button"
              variant="solidDark"
              className="text-xs"
              fullWidth={false}
              disabled={deleting}
              onClick={() => onEdit?.(recap)}
            >
              Edit
            </Button>
          ) : null}
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
      </div>
    </li>
  );
}
