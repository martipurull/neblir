import { isAllowedHttpHref } from "@/app/lib/tiptap/richTextSanitize";
import StarterKit from "@tiptap/starter-kit";

/** Shared TipTap stack for every editor and generateHTML/JSON path. */
export const RICH_TEXT_EXTENSIONS = [
  StarterKit.configure({
    link: {
      openOnClick: false,
      autolink: false,
      linkOnPaste: false,
      shouldAutoLink: () => false,
      defaultProtocol: "https",
      HTMLAttributes: {
        target: "_blank",
        rel: "noopener noreferrer",
      },
      isAllowedUri: (url) => isAllowedHttpHref(url),
    },
  }),
];
