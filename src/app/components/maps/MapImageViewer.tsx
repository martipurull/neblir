"use client";

import { ModalShell } from "@/app/components/shared/ModalShell";
import Image from "next/image";
import React from "react";

interface MapImageViewerProps {
  title: string;
  imageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MapImageViewer({
  title,
  imageUrl,
  isOpen,
  onClose,
}: MapImageViewerProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      titleId="map-image-viewer-title"
      maxWidthClass="max-w-[96vw]"
      maxHeightClass="max-h-[94vh]"
      panelClassName="bg-black"
    >
      {imageUrl ? (
        <div
          className="overflow-auto rounded bg-black/60"
          style={{ touchAction: "pan-x pan-y pinch-zoom" }}
        >
          <div className="relative h-[80vh] min-w-full md:min-w-0 md:w-[90vw]">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="90vw"
              className="rounded object-contain"
              unoptimized
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-white/80">Map image unavailable.</p>
      )}
    </ModalShell>
  );
}
