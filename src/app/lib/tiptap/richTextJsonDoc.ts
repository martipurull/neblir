import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

/** Shared with JSON TipTap editors and `generateHTML` so stored JSON round-trips. */
const RICH_TEXT_JSON_EXTENSIONS = [StarterKit];

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
  const doc = parseStoredRichTextDoc(stored);
  if (isRichTextDocEmpty(doc)) return "";
  return generateHTML(doc, RICH_TEXT_JSON_EXTENSIONS);
}
