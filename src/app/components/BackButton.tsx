"use client";

import { usePathname, useRouter } from "next/navigation";

/**
 * Returns the parent path in the app hierarchy (one level above the current path).
 * e.g. /home/games/123/gm → /home/games/123, /home/games/create → /home/games, /home → null
 */
function getParentPath(pathname: string): string | null {
  const trimmed = pathname.replace(/\/$/, "") || "/";
  if (trimmed === "/home" || trimmed === "/") return null;
  const parent = trimmed.replace(/\/[^/]+$/, "");
  return parent && parent !== trimmed ? parent : null;
}

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const parentPath = getParentPath(pathname ?? "");

  if (parentPath === null) {
    return <div />;
  }

  const handleBack = () => {
    router.push(parentPath);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex h-11 items-center justify-center rounded-md bg-transparent px-3 text-sm font-semibold text-black transition-colors duration-500 ease-in-out hover:cursor-pointer active:bg-paleBlue/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-black md:hover:bg-paleBlue/30 md:active:bg-paleBlue/40"
      aria-label="Go back"
    >
      ← Back
    </button>
  );
}
