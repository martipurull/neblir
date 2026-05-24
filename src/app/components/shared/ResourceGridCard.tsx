"use client";

import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { richTextToPlainTextPreview } from "@/app/lib/tiptap/richTextPlainTextPreview";

export type ResourceGridCardProps = {
  href: string;
  title: string;
  /** Short line under the title (type, stats, category, etc.). */
  meta?: string;
  bodyLabel?: string;
  /** Plain-text body (already stripped). */
  body?: string | null;
  /** Stored rich text; converted to plain text for display. */
  richBody?: string | null | undefined;
  emptyBodyText?: string;
  imageUrl?: string | null;
  imageAlt?: string;
  minHeightClass?: string;
};

export default function ResourceGridCard({
  href,
  title,
  meta,
  bodyLabel = "Description",
  body,
  richBody,
  emptyBodyText = "No description",
  imageUrl,
  imageAlt = "",
  minHeightClass = "min-h-[14rem]",
}: ResourceGridCardProps) {
  const bodyPreview = useMemo(() => {
    if (body !== undefined && body !== null) {
      const t = body.trim();
      return t || null;
    }
    if (richBody !== undefined) {
      return richTextToPlainTextPreview(richBody);
    }
    return null;
  }, [body, richBody]);

  const showBodySection = body !== undefined || richBody !== undefined;
  const showImage = imageUrl !== undefined;

  return (
    <Link
      href={href}
      className={`flex h-full w-full flex-col rounded-lg border-2 border-black bg-transparent p-5 text-black shadow-sm transition-colors duration-200 ease-in-out hover:bg-paleBlue/30 ${minHeightClass}`}
    >
      {showImage ? (
        <div className="mb-3 flex h-16 w-full shrink-0 items-center justify-center overflow-hidden rounded-md border border-black/15 bg-paleBlue/20 p-1.5">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              width={320}
              height={64}
              className="max-h-full max-w-full object-contain object-center"
              unoptimized
            />
          ) : imageUrl === undefined ? (
            <ImageLoadingSkeleton variant="item" className="h-full w-full" />
          ) : null}
        </div>
      ) : null}

      <h3 className="shrink-0 text-lg font-semibold leading-tight">{title}</h3>

      {meta ? (
        <p className="mt-1.5 shrink-0 text-xs font-medium text-black/65">
          {meta}
        </p>
      ) : null}

      {showBodySection ? (
        <div className="mt-3 flex min-h-0 flex-1 flex-col border-t border-black/15 pt-3">
          <p className="shrink-0 text-[0.65rem] font-bold uppercase tracking-wider text-black/55">
            {bodyLabel}
          </p>
          {bodyPreview ? (
            <p className="mt-1.5 line-clamp-6 text-sm leading-relaxed text-black/80">
              {bodyPreview}
            </p>
          ) : (
            <p className="mt-1.5 text-sm italic leading-relaxed text-black/50">
              {emptyBodyText}
            </p>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1" aria-hidden />
      )}
    </Link>
  );
}
