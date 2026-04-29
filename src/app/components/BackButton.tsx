"use client";

import Button from "@/app/components/shared/Button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const parentPath = getParentPath(pathname ?? "");
  const returnTo = searchParams.get("returnTo");
  const explicitBackTarget = returnTo?.startsWith("/home") ? returnTo : null;

  if (parentPath === null && explicitBackTarget === null) {
    return <div />;
  }

  const handleBack = () => {
    router.push(explicitBackTarget ?? parentPath ?? "/home");
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
