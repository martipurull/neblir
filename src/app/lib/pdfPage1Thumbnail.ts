import { PDF_THUMBNAIL_CONTENT_TYPE } from "@/app/lib/r2UploadKeys";

const PDF_THUMBNAIL_MAX_WIDTH = 512;
const PDF_THUMBNAIL_JPEG_QUALITY = 0.72;

async function renderPdfPage1Jpeg(pdf: File): Promise<Blob | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();

    const data = new Uint8Array(await pdf.arrayBuffer());
    const doc = await pdfjs.getDocument({ data }).promise;
    try {
      const page = await doc.getPage(1);
      const unscaled = page.getViewport({ scale: 1 });
      const scale = Math.min(PDF_THUMBNAIL_MAX_WIDTH / unscaled.width, 2);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      return await new Promise((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob),
          PDF_THUMBNAIL_CONTENT_TYPE,
          PDF_THUMBNAIL_JPEG_QUALITY
        );
      });
    } finally {
      await doc.destroy();
    }
  } catch {
    return null;
  }
}

export async function tryUploadPdfPage1Thumbnail(options: {
  pdf: File;
  thumbnailFileKey?: string;
  thumbnailUploadUrl?: string;
}): Promise<string | undefined> {
  const { pdf, thumbnailFileKey, thumbnailUploadUrl } = options;
  if (!thumbnailFileKey || !thumbnailUploadUrl) return undefined;

  const blob = await renderPdfPage1Jpeg(pdf);
  if (!blob) return undefined;

  try {
    const response = await fetch(thumbnailUploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": PDF_THUMBNAIL_CONTENT_TYPE },
    });
    if (!response.ok) return undefined;
    return thumbnailFileKey;
  } catch {
    return undefined;
  }
}
