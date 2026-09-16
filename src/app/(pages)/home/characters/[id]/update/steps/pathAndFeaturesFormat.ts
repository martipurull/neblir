import type { PathName } from "@prisma/client";

export type PathOption = {
  id: string;
  name: PathName;
  description: string | null;
  baseFeature: string;
};

export function formatPathLabel(name: string): string {
  return name.replace(/_/g, " ");
}

export function parseAtLeastOne(raw: string): number {
  return Math.max(1, parseInt(raw, 10) || 1);
}
