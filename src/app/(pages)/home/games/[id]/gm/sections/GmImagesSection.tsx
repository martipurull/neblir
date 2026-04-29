import Button from "@/app/components/shared/Button";
import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import type { GameImage } from "@/app/lib/types/gameImage";
import { useImageUrls } from "@/hooks/use-image-urls";
import Image from "next/image";
import Link from "next/link";

type GmImagesSectionProps = {
  images: GameImage[];
  loading: boolean;
  error: string | null;
  deletingImageId: string | null;
  onRetry: () => void;
  onCreateImage: () => void;
  onDeleteImage: (image: GameImage) => void;
};

export function GmImagesSection({
  images,
  loading,
  error,
  deletingImageId,
  onRetry,
  onCreateImage,
  onDeleteImage,
}: GmImagesSectionProps) {
  const imageUrls = useImageUrls(
    images.map((image) => ({ id: image.id, imageKey: image.imageKey }))
  );

  return (
    <InfoCard border>
      <h3 className="text-lg font-semibold text-black">Images</h3>
      <p className="mt-1 text-sm text-black/70">
        Upload visuals for players to view and download.
      </p>
      <div className="mt-3">
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onCreateImage}
        >
          Upload image
        </Button>
      </div>
      <div className="mt-4">
        {loading ? (
          <LoadingState text="Loading images..." />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : images.length === 0 ? (
          <p className="text-sm text-black/70">No images uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {images.map((image) => {
              const imageUrl = imageUrls[image.id];
              return (
                <li
                  key={image.id}
                  className="rounded-md border border-black/10 bg-paleBlue/50 p-3"
                >
                  <p className="text-sm font-semibold text-black">
                    {image.title}
                  </p>
                  {image.description ? (
                    <p className="mt-1 text-xs text-black/80">
                      {image.description}
                    </p>
                  ) : null}
                  {imageUrl ? (
                    <Link
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block"
                    >
                      <Image
                        src={imageUrl}
                        alt={image.title}
                        width={1600}
                        height={900}
                        sizes="(max-width: 768px) 100vw, 640px"
                        className="max-h-48 w-full rounded border border-black/20 object-contain"
                        unoptimized
                      />
                    </Link>
                  ) : null}
                  <div className="mt-3 flex items-center gap-2">
                    {imageUrl ? (
                      <Link href={imageUrl} target="_blank" rel="noreferrer">
                        <Button
                          type="button"
                          variant="solidDark"
                          className="text-xs"
                          fullWidth={false}
                        >
                          Download
                        </Button>
                      </Link>
                    ) : null}
                    <Button
                      type="button"
                      variant="danger"
                      className="text-xs"
                      fullWidth={false}
                      disabled={deletingImageId === image.id}
                      onClick={() => onDeleteImage(image)}
                    >
                      {deletingImageId === image.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </InfoCard>
  );
}
