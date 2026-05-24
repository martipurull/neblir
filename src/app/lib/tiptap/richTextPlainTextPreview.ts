import { storedRichTextToDisplayHtml } from "@/app/lib/tiptap/generalInformationRichText";

/** Strip HTML to a single line of plain text (browser or lightweight SSR fallback). */
export function stripHtmlToPlainText(html: string): string {
  if (!html) return "";
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = html;
    return (el.textContent ?? "").replace(/\s+/g, " ").trim();
  }
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Stored TipTap / HTML → plain text for card previews and search snippets. */
export function richTextToPlainTextPreview(
  content: string | null | undefined
): string | null {
  const html = storedRichTextToDisplayHtml(content);
  if (!html) return null;
  const text = stripHtmlToPlainText(html);
  return text || null;
}
