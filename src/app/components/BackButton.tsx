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
      className="min-h-11 rounded-md bg-gray-200 px-3 text-sm font-semibold text-gray-800 transition-colors hover:cursor-pointer hover:bg-gray-300 active:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
      aria-label="Go back"
    >
      ← Back
    </button>
  );
}
