import { RICH_TEXT_EXTENSIONS } from "@/app/lib/tiptap/richTextExtensions";
import {
  isAllowedHttpHref,
  sanitizeRichTextHtmlAnchors,
} from "@/app/lib/tiptap/richTextSanitize";
import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";

export const EMPTY_RICH_TEXT_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function nodeHasNonWhitespaceText(node: JSONContent): boolean {
  if (node.type === "text" && typeof node.text === "string") {
    return node.text.trim().length > 0;
  }
  if (node.content?.length) {
    return node.content.some(nodeHasNonWhitespaceText);
  }
  return false;
}

export function isRichTextDocEmpty(doc: JSONContent): boolean {
  if (!doc.content?.length) return true;
  return !doc.content.some(nodeHasNonWhitespaceText);
}

/** Parse DB string: TipTap JSON doc, or legacy plain text. */
function parseStoredRichTextDoc(stored: string): JSONContent {
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as JSONContent).type === "doc"
    ) {
      return parsed as JSONContent;
    }
  } catch {
    // legacy plain string
  }
  const text = stored.trim();
  if (!text) return EMPTY_RICH_TEXT_DOC;
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: stored }] }],
  };
}

export function storedRichTextJsonToHtml(stored: string): string {
  return richTextJsonDocToHtml(parseStoredRichTextDoc(stored));
}

export function richTextJsonDocToHtml(doc: JSONContent): string {
  if (isRichTextDocEmpty(doc)) return "";
  return sanitizeRichTextHtmlAnchors(generateHTML(doc, RICH_TEXT_EXTENSIONS));
}

function sanitizeJsonMarks(
  marks: NonNullable<JSONContent["marks"]>
): NonNullable<JSONContent["marks"]> | undefined {
  const next = marks.filter((mark) => {
    if (mark.type !== "link") return true;
    const href =
      typeof mark.attrs?.href === "string" ? mark.attrs.href : undefined;
    return isAllowedHttpHref(href);
  });
  return next.length > 0 ? next : undefined;
}

/** Drop link marks whose href is not http(s); other marks stay. */
export function sanitizeRichTextJsonDoc(doc: JSONContent): JSONContent {
  const next: JSONContent = { ...doc };
  if (next.marks?.length) {
    const marks = sanitizeJsonMarks(next.marks);
    if (marks) next.marks = marks;
    else delete next.marks;
  }
  if (next.content?.length) {
    next.content = next.content.map(sanitizeRichTextJsonDoc);
  }
  return next;
}
