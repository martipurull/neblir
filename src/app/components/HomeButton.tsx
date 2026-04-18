"use client";

import { ghostNavButtonClassName } from "@/app/components/shared/buttonStyles";
import Link from "next/link";

export function HomeButton() {
  return (
    <Link
      href="/home"
      className={ghostNavButtonClassName}
      aria-label="Go to home"
    >
      Home
    </Link>
  );
}
