"use client";

import { getImageUrl } from "@/lib/api/image";
import Image, { type ImageProps } from "next/image";
import { useCallback, useRef, useState } from "react";

const MAX_LOAD_RETRIES = 3;
const LOAD_RETRY_DELAY_MS = 500;

type SignedRemoteImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string;
  /** When set, a failed browser load refetches a fresh presigned URL. */
  imageKey?: string;
  onLoadError?: () => void;
};

type SignedRemoteImageLoaderProps = SignedRemoteImageProps;

function SignedRemoteImageLoader({
  src,
  imageKey,
  onLoadError,
  unoptimized = true,
  ...imageProps
}: SignedRemoteImageLoaderProps) {
  const [retrySrc, setRetrySrc] = useState<string | null>(null);
  const loadAttemptsRef = useRef(0);

  const handleError = useCallback(async () => {
    if (!imageKey || loadAttemptsRef.current >= MAX_LOAD_RETRIES) {
      onLoadError?.();
      return;
    }
    loadAttemptsRef.current += 1;
    await new Promise((resolve) =>
      setTimeout(resolve, loadAttemptsRef.current * LOAD_RETRY_DELAY_MS)
    );
    try {
      const freshUrl = await getImageUrl(imageKey);
      setRetrySrc(freshUrl);
    } catch {
      if (loadAttemptsRef.current >= MAX_LOAD_RETRIES) {
        onLoadError?.();
      }
    }
  }, [imageKey, onLoadError]);

  return (
    <Image
      {...imageProps}
      src={retrySrc ?? src}
      unoptimized={unoptimized}
      onError={() => void handleError()}
      alt={imageProps.alt ?? ""}
    />
  );
}

/**
 * Renders a private R2 object via its presigned URL.
 * Uses `unoptimized` by default (Next's image optimizer is flaky with expiring signed URLs in prod).
 * Retries with a freshly signed URL when the browser reports a load failure.
 */
export function SignedRemoteImage({ src, ...props }: SignedRemoteImageProps) {
  return <SignedRemoteImageLoader key={src} src={src} {...props} />;
}
