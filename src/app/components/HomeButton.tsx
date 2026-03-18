"use client";

import Link from "next/link";

export function HomeButton() {
  return (
    <Link
      href="/home"
      className="min-h-11 rounded-md bg-transparent px-3 py-2 text-sm font-semibold text-black transition-colors hover:cursor-pointer hover:bg-black/10 active:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
      aria-label="Go to home"
    >
      Home
    </Link>
  );
}
