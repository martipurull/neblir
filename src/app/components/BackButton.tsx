"use client";

import { usePathname, useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/home") {
    return <div />;
  }

  const handleBack = () => {
    if (window.history.length <= 1) {
      router.push("/home");
      return;
    }

    router.back();
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="min-h-11 rounded-md bg-transparent px-3 text-sm font-semibold text-black transition-colors hover:cursor-pointer hover:bg-black/10 active:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
      aria-label="Go back"
    >
      ← Back
    </button>
  );
}
