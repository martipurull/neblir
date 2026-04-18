"use client";

import Button from "@/app/components/shared/Button";
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
    <Button
      type="button"
      variant="ghostNav"
      fullWidth={false}
      onClick={handleBack}
      aria-label="Go back"
    >
      ← Back
    </Button>
  );
}
