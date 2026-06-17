/** Preview breakpoints for vertical character section grid (matches Tailwind in CharacterSectionGrid). */
export type CharacterSectionGridPreview =
  | "mobile"
  | "tablet"
  | "desktopSmall"
  | "desktopLarge";

export const CHARACTER_SECTION_GRID_PREVIEW_OPTIONS: ReadonlyArray<{
  value: CharacterSectionGridPreview;
  label: string;
}> = [
  { value: "mobile", label: "Mobile" },
  { value: "tablet", label: "Tablet" },
  { value: "desktopSmall", label: "Desktop S" },
  { value: "desktopLarge", label: "Desktop L" },
];

export function isCharacterSectionGridPreview(
  value: string
): value is CharacterSectionGridPreview {
  return CHARACTER_SECTION_GRID_PREVIEW_OPTIONS.some(
    (option) => option.value === value
  );
}

/** Tailwind defaults — keep in sync with CharacterSectionGrid responsive columns. */
const CHARACTER_SECTION_GRID_BREAKPOINTS = {
  tablet: 768,
  desktopSmall: 1280,
  desktopLarge: 1536,
} as const;

function characterSectionGridMaxPreviewForViewport(
  viewportWidth: number
): CharacterSectionGridPreview {
  if (viewportWidth >= CHARACTER_SECTION_GRID_BREAKPOINTS.desktopLarge) {
    return "desktopLarge";
  }
  if (viewportWidth >= CHARACTER_SECTION_GRID_BREAKPOINTS.desktopSmall) {
    return "desktopSmall";
  }
  if (viewportWidth >= CHARACTER_SECTION_GRID_BREAKPOINTS.tablet) {
    return "tablet";
  }
  return "mobile";
}

const CHARACTER_SECTION_GRID_PREVIEW_RANK: Record<
  CharacterSectionGridPreview,
  number
> = {
  mobile: 0,
  tablet: 1,
  desktopSmall: 2,
  desktopLarge: 3,
};

/** Preview options the current viewport is wide enough to display. */
export function getAvailableCharacterSectionGridPreviewOptions(
  viewportWidth: number
): ReadonlyArray<{
  value: CharacterSectionGridPreview;
  label: string;
}> {
  const maxPreview = characterSectionGridMaxPreviewForViewport(viewportWidth);
  const maxRank = CHARACTER_SECTION_GRID_PREVIEW_RANK[maxPreview];
  return CHARACTER_SECTION_GRID_PREVIEW_OPTIONS.filter(
    (option) => CHARACTER_SECTION_GRID_PREVIEW_RANK[option.value] <= maxRank
  );
}

export function resolveCharacterSectionGridPreviewForViewport(
  preview: CharacterSectionGridPreview,
  viewportWidth: number
): CharacterSectionGridPreview {
  const maxPreview = characterSectionGridMaxPreviewForViewport(viewportWidth);
  if (
    CHARACTER_SECTION_GRID_PREVIEW_RANK[preview] <=
    CHARACTER_SECTION_GRID_PREVIEW_RANK[maxPreview]
  ) {
    return preview;
  }
  return maxPreview;
}

/** Responsive grid on the character page (vertical layout). */
export const CHARACTER_SECTION_GRID_RESPONSIVE_CLASS =
  "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

/** Fixed chip width for settings reorder preview (fits four columns in the settings card). */
export const CHARACTER_SECTION_ORDER_PREVIEW_CHIP_WIDTH_CLASS = "w-[8.5rem]";

export function characterSectionGridPreviewColumnCount(
  preview: CharacterSectionGridPreview
): number {
  switch (preview) {
    case "mobile":
      return 1;
    case "tablet":
      return 2;
    case "desktopSmall":
      return 3;
    case "desktopLarge":
      return 4;
  }
}

const CHARACTER_SECTION_GRID_PREVIEW_LIST_CLASS: Record<
  CharacterSectionGridPreview,
  string
> = {
  mobile: "grid gap-2 [grid-template-columns:repeat(1,8.5rem)]",
  tablet: "grid gap-2 [grid-template-columns:repeat(2,8.5rem)]",
  desktopSmall: "grid gap-2 [grid-template-columns:repeat(3,8.5rem)]",
  desktopLarge: "grid gap-2 [grid-template-columns:repeat(4,8.5rem)]",
};

/** Fixed-column grid for settings reorder preview at a chosen breakpoint. */
export function characterSectionGridPreviewGridClassName(
  preview: CharacterSectionGridPreview
): string {
  return CHARACTER_SECTION_GRID_PREVIEW_LIST_CLASS[preview];
}
