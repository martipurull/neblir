import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";

type FileKindThumbnailProps = {
  kind: "IMAGE" | "PDF";
  title: string;
  imageUrl?: string | null;
};

export function FileKindThumbnail({
  kind,
  title,
  imageUrl,
}: FileKindThumbnailProps) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-black/15 bg-paleBlue/20 p-1">
      {kind === "PDF" ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-black/70">
          PDF
        </span>
      ) : imageUrl ? (
        <SignedRemoteImage
          src={imageUrl}
          alt={title}
          width={128}
          height={128}
          className="max-h-full max-w-full object-contain object-center"
        />
      ) : imageUrl === null ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-black/70">
          IMG
        </span>
      ) : (
        <ImageLoadingSkeleton variant="item" className="h-full w-full" />
      )}
    </div>
  );
}
