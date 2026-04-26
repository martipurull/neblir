"use client";

import type { GameMap } from "@/app/lib/types/map";
import { useImageUrls } from "@/hooks/use-image-urls";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import ImageLoadingSkeleton from "../shared/ImageLoadingSkeleton";

interface MapsListProps {
  maps: GameMap[];
}

export function MapsList({ maps }: MapsListProps) {
  const [expandedMapIds, setExpandedMapIds] = useState<Set<string>>(
    () => new Set()
  );

  const imageEntries = useMemo(
    () =>
      maps.map((map) => ({
        id: map.id,
        imageKey: map.imageKey,
      })),
    [maps]
  );
  const imageUrls = useImageUrls(imageEntries);
  const hasMultipleMaps = maps.length > 1;

  function toggleMap(mapId: string) {
    setExpandedMapIds((current) => {
      const next = new Set(current);
      if (next.has(mapId)) {
        next.delete(mapId);
      } else {
        next.add(mapId);
      }
      return next;
    });
  }

  return (
    <div className="mt-5 space-y-5">
      {maps.map((map) => {
        const isExpanded = !hasMultipleMaps || expandedMapIds.has(map.id);
        const imageUrl = imageUrls[map.id];

        return (
          <article
            key={map.id}
            className="rounded-md border border-black bg-paleBlue/10 p-4"
          >
            {hasMultipleMaps ? (
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                aria-expanded={isExpanded}
                onClick={() => toggleMap(map.id)}
              >
                <span>
                  <span className="block text-lg font-semibold text-black">
                    {map.name}
                  </span>
                  {map.description ? (
                    <span className="mt-1 block text-sm text-black/70">
                      {map.description}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-black/70">
                  {isExpanded ? "Hide" : "Show"}
                </span>
              </button>
            ) : (
              <header className="mb-3">
                <h2 className="text-lg font-semibold text-black">{map.name}</h2>
                {map.description ? (
                  <p className="mt-1 text-sm text-black/70">
                    {map.description}
                  </p>
                ) : null}
              </header>
            )}

            {isExpanded ? (
              <div className={hasMultipleMaps ? "mt-4" : ""}>
                {imageUrl ? (
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full overflow-hidden rounded-md border border-black/20 bg-black/5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    <span className="sr-only">Open {map.name} image</span>
                    <span className="block w-full">
                      <Image
                        src={imageUrl}
                        alt={map.name}
                        width={1600}
                        height={900}
                        sizes="(max-width: 768px) 100vw, 1024px"
                        className="h-auto max-h-[70vh] w-full object-contain"
                        unoptimized
                      />
                    </span>
                  </a>
                ) : imageUrl === undefined ? (
                  <div className="block h-56 overflow-hidden rounded-md border border-black/20 bg-black/5">
                    <ImageLoadingSkeleton
                      variant="cityscape"
                      className="!bg-black/5"
                    />
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-md border border-black/20 bg-black/5 px-4 text-sm text-black/60">
                    Map image unavailable.
                  </div>
                )}
                {imageUrl ? (
                  <p className="mt-2 text-xs text-black/60">
                    Tap or click the map to open the full image.
                  </p>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
