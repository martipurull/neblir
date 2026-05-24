import { serializeEditorToStoredHtml } from "@/app/lib/tiptap/generalInformationRichText";

/** Shared TipTap scroll cap for super-admin create forms (fixed rem — no `vh`). */
export const superAdminRichEditorScrollClass =
  "max-h-80 overflow-y-auto overflow-x-hidden overscroll-y-contain sm:max-h-96";

/** Rich-text HTML → optional API field (omit when visually empty). */
export function optionalSuperAdminRichHtml(html: string): string | undefined {
  const t = html.trim();
  if (!t) return undefined;
  const persisted = serializeEditorToStoredHtml(t);
  return persisted || undefined;
}
