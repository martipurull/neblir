export function linkVisibilityBadgeClassName(isPublic: boolean): string {
  return [
    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
    isPublic
      ? "border-neblirSafe-400/50 bg-neblirSafe-200/30 text-black"
      : "border-neblirDanger-300/50 bg-neblirDanger-100/40 text-black",
  ].join(" ");
}

export function linkVisibilityLabel(isPublic: boolean): "Public" | "Private" {
  return isPublic ? "Public" : "Private";
}
