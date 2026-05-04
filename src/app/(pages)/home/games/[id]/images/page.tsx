"use client";

import Button from "@/app/components/shared/Button";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import { useGame } from "@/hooks/use-game";
import { useGameImages } from "@/hooks/use-game-images";
import { useImageUrls } from "@/hooks/use-image-urls";
import { deleteGameImage } from "@/lib/api/gameImages";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function GameImagesPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game } = useGame(id);
  const { images, loading, error, refetch } = useGameImages(id);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const imageUrls = useImageUrls(
    images.map((image) => ({ id: image.id, imageKey: image.imageKey }))
  );
  const isGameMaster = game?.isGameMaster === true;

  if (!id) {
    return (
      <PageSection>
        <ErrorState message="Game not found" />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <div className="flex flex-col gap-4">
        <PageTitle>Images</PageTitle>
        {loading ? (
          <LoadingState text="Loading images..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void refetch()} />
        ) : images.length === 0 ? (
          <p className="text-sm text-black/70">No images uploaded yet.</p>
        ) : (
          <ul className="space-y-3">
            {images.map((image) => {
              const imageUrl = imageUrls[image.id];
              return (
                <li
                  key={image.id}
                  className="rounded-lg border border-black/10 bg-paleBlue/40 p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-black">
                    {image.title}
                  </p>
                  <p className="mt-0.5 text-xs text-black/65">
                    Added {new Date(image.createdAt).toLocaleDateString()}
                  </p>
                  {image.description ? (
                    <p className="mt-2 text-xs text-black/80">
                      {image.description}
                    </p>
                  ) : null}
                  {imageUrl ? (
                    <Link
                      href={imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block overflow-hidden rounded border border-black/20 bg-black/5"
                    >
                      <Image
                        src={imageUrl}
                        alt={image.title}
                        width={1600}
                        height={900}
                        sizes="(max-width: 768px) 100vw, 1024px"
                        className="max-h-[70vh] w-full object-contain"
                        unoptimized
                      />
                    </Link>
                  ) : null}
                  {imageUrl ? (
                    <p className="mt-1 text-xs text-black/60">
                      Tap or click the image to view full size.
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center gap-2">
                    {imageUrl ? (
                      <Link href={imageUrl} target="_blank" rel="noreferrer">
                        <Button
                          type="button"
                          variant="solidDark"
                          fullWidth={false}
                          className="text-xs"
                        >
                          Download
                        </Button>
                      </Link>
                    ) : null}
                    {isGameMaster ? (
                      <Button
                        type="button"
                        variant="danger"
                        fullWidth={false}
                        className="text-xs"
                        disabled={deletingImageId === image.id}
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Delete image "${image.title}"? This cannot be undone.`
                            )
                          )
                            return;
                          setDeletingImageId(image.id);
                          void deleteGameImage(id, image.id)
                            .then(async () => {
                              await refetch();
                            })
                            .finally(() => {
                              setDeletingImageId(null);
                            });
                        }}
                      >
                        {deletingImageId === image.id ? "Deleting…" : "Delete"}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageSection>
  );
}
