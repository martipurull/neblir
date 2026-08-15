import { Button } from "@/app/components/shared/Button";
import { FileKindThumbnail } from "@/app/components/shared/FileKindThumbnail";
import type { GameFile } from "@/app/lib/types/gameFile";

type GameFileCardProps = {
  file: GameFile;
  fileUrl?: string | null;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: (file: GameFile) => void;
  onOpen: (file: GameFile) => void;
  onDownload: (file: GameFile) => void;
};

export function GameFileCard({
  file,
  fileUrl,
  canDelete = false,
  deleting = false,
  onDelete,
  onOpen,
  onDownload,
}: GameFileCardProps) {
  return (
    <li className="flex gap-3 rounded-md border border-black/10 bg-paleBlue/40 p-3">
      <FileKindThumbnail
        kind={file.kind}
        title={file.title}
        imageUrl={fileUrl}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-black">
          {file.title}
        </p>
        <p className="truncate text-xs text-black/65">
          {new Date(file.createdAt).toLocaleDateString()} • {file.fileName}
        </p>
        {file.description ? (
          <p className="mt-1 text-xs text-black/80">{file.description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="solidDark"
            className="text-xs"
            fullWidth={false}
            onClick={() => onOpen(file)}
          >
            Open
          </Button>
          <Button
            type="button"
            variant="solidDark"
            className="text-xs"
            fullWidth={false}
            onClick={() => onDownload(file)}
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
              onClick={() => onDelete?.(file)}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
