/**
 * Shared button surface classes. Import from here when a component cannot use
 * {@link ./Button} (e.g. Next.js `Link` styled as a nav control).
 */

/** Toolbar / header nav: Back, Home, Sign out — paleBlue hover, no fill. */
export const ghostNavButtonClassName =
  "inline-flex h-11 items-center justify-center rounded-md bg-transparent px-3 text-sm font-semibold text-black transition-colors duration-500 ease-in-out hover:cursor-pointer active:bg-paleBlue/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-black md:hover:bg-paleBlue/30 md:active:bg-paleBlue/40";

export type AppButtonVariant =
  | "primary"
  | "secondary"
  /** Inline outline (e.g. retry, compact toolbar actions on light surfaces). */
  | "quiet"
  | "ghostNav"
  /** Modal shell on dark `modalBackground` panels — primary CTA row. */
  | "modalFooterPrimary"
  /** Modal shell — secondary / cancel row. */
  | "modalFooterSecondary"
  /** Small ± steppers inside dark modals (square icon button). */
  | "modalIconStepper"
  /** Narrower steppers (e.g. damage “extra dice” row in attack modal). */
  | "modalIconStepperSmall"
  /** Full-width primary block inside modal body (e.g. “Roll damage”). */
  | "modalBlockPrimary"
  /** Selectable row — selected state (weapon list in attack modal). */
  | "modalOptionSelected"
  /** Selectable row — unselected state. */
  | "modalOptionUnselected"
  /** Compact warning outline on modal rows (e.g. GM NPC initiative). */
  | "modalCompactWarning"
  /** × in modal header (matches {@link ModalShell} close). */
  | "modalClose"
  /** Inline toolbar: Refresh, Add email, etc. on dark modals. */
  | "modalToolbarAction"
  /** Text link on dark modal rows (e.g. remove from list). */
  | "modalInlineLink"
  /** Full-width low-contrast CTA on dark modals (e.g. wallet adjust). */
  | "modalMutedPrimary"
  /** Cancel / outline using paleBlue border on dark panels (e.g. stat edit). */
  | "modalPaleOutline"
  /** Filled paleBlue on dark panels (e.g. stat edit save). */
  | "modalPalePrimary"
  /** × on light modal chrome (dark text / subtle hover). */
  | "modalCloseLight"
  /** × on dark purple `modalBackground` panels (paleBlue glyph). */
  | "modalClosePale"
  /** Light UI — row cell behaves as one tappable title (e.g. inventory name). */
  | "lightRowHit"
  /** Light UI — tiny pill Equip / Unequip (inventory last column). */
  | "lightPillAction"
  /** Light UI — compact outline toolbar (e.g. Browse / Create unique). */
  | "lightToolbarCompact"
  /** Light UI — muted underlined “show more” control. */
  | "lightLinkSubtle"
  /** Light UI — green-bordered chip, `text-sm` (e.g. + Add feature). */
  | "lightChipSafe"
  /** Light UI — green-bordered chip, `text-xs` (e.g. + Grade). */
  | "lightChipSafeCompact"
  /** Light UI — red-bordered chip, `text-xs` (e.g. − Grade). */
  | "lightChipDangerCompact"
  /** Muted outline (level-up “Check current…”, soft borders). */
  | "lightOutlineMuted"
  /** Compact outline control (e.g. Roll d10). */
  | "lightRollChip"
  /** Level-up path pick — large bordered card. */
  | "lightPathCard"
  /** Feature slot tab — active (customPrimary). */
  | "lightSlotActive"
  /** Feature slot tab — idle. */
  | "lightSlotIdle"
  /** Extra-compact outline (e.g. Clear active slot). */
  | "lightCompactXsMuted"
  /** Disabled neutral chip (level-up feature picks when unavailable). */
  | "lightChipNeutralMuted"
  /** Accordion row — feature list on light UI. */
  | "lightDisclosureRow"
  /** Square + icon (notes toolbar). */
  | "lightSquareIcon"
  /** Dice/roll selection row — attributes column. */
  | "lightAttributeDiceRow"
  /** Dice/roll selection row — skills column (baseline). */
  | "lightSkillDiceRow"
  /** Simple list row — special skills. */
  | "lightSpecialSkillRow"
  /** List row with image slot — custom item browse. */
  | "lightBrowseRow"
  /** ClassName-only base for highly dynamic surfaces (e.g. {@link StatCell}). */
  | "surfaceInherit"
  /** Light-UI combobox trigger ({@link SelectDropdown}). */
  | "selectTriggerLight"
  /** Dark modal combobox trigger ({@link ModalSelect}). */
  | "selectTriggerModal"
  | "stepperDotComplete"
  | "stepperDotCurrent"
  | "stepperDotIdle"
  | "datePickerTrigger"
  | "datePickerMonthNav"
  | "datePickerDay"
  | "datePickerDayToday"
  | "datePickerClear"
  /** Icon control; pair with `className` for left/right positioning ({@link CarouselArrows}). */
  | "carouselArrow"
  | "carouselDotActive"
  | "carouselDotInactive"
  /** Full-width ghost row in modal footer (e.g. damage roll close). */
  | "modalFooterGhostFull"
  /** Small ± on dark modal with 1px border (damage roll extra dice). */
  | "modalIconStepperFlatSm"
  /** Large modal ± (item uses). */
  | "modalIconStepperLg"
  /** Subtle bordered block on dark panels (leave / take item). */
  | "modalSubtleWhiteBorderBlock"
  /** Bordered × on paleBlue-framed modals (note editor). */
  | "modalClosePaleBordered"
  /** Full-width tappable row in dark modal lists. */
  | "modalListRowHit"
  /** Compact primary CTA without `min-h-11` (GM sections, initiative). */
  | "primarySm"
  /** Extra-small primary (invites, discord). */
  | "primaryXs"
  /** Muted outline, `text-xs` (decline invite, secondary compact). */
  | "secondaryOutlineXs"
  /** Full-width section header toggle (GM invites card). */
  | "lightSectionDisclosure"
  /** Inverted CTA on light surfaces (add characters). */
  | "solidDark"
  /** Square summary expand/collapse on game characters list. */
  | "lightChevronExpand"
  /** Wide combat toggle on character summary. */
  | "lightCombatToggle"
  /** Fixed-width add-currency row (character create). */
  | "lightCurrencyAddRow"
  /** Dismiss-style text control (remove currency). */
  | "lightDangerLink"
  | "lightPathTitleLink"
  | "lightDisclosureChevron"
  | "lightTemplateInfoIcon"
  /** Dice / overflow icon buttons on character header. */
  | "lightHeaderIconAffordance"
  /** Character note list preview row. */
  | "lightNoteListRow"
  | "lightOutlineBlackSm"
  | "lightOutlineDangerSm"
  | "lightOutlineMutedSm"
  | "lightRemoveLinkOnPale"
  | "lightRemoveLinkOnModal"
  /** Full-width title disclosure for reference/map cards. */
  | "lightReferenceDisclosure";

const primary =
  "min-h-11 rounded-md bg-customPrimary px-4 py-2 text-customSecondary transition-colors hover:bg-customPrimaryHover active:bg-customPrimaryHover focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-200 disabled:opacity-80 disabled:hover:bg-gray-500 disabled:active:bg-gray-500";

const secondary =
  "min-h-11 rounded-md border-2 border-black/30 px-4 py-2 text-black transition-colors hover:border-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

const quiet =
  "rounded-md border border-black bg-transparent px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

const modalFooterPrimary =
  "rounded-md border-2 border-white bg-paleBlue px-3 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-paleBlue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-paleBlue";

const modalFooterSecondary =
  "rounded-md border-2 border-white bg-transparent px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50";

const modalIconStepper =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50";

const modalIconStepperSmall =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 border-white bg-transparent text-sm font-bold text-white transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50";

const modalBlockPrimary =
  "w-full rounded border-2 border-white bg-paleBlue py-2 text-sm font-semibold text-black transition-colors hover:bg-paleBlue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-paleBlue";

const modalOptionSelected =
  "rounded-md border-2 border-white bg-paleBlue px-3 py-2 text-left text-sm font-semibold text-black transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

const modalOptionUnselected =
  "rounded-md border-2 border-white bg-transparent px-3 py-2 text-left text-sm font-semibold text-white transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

const modalCompactWarning =
  "shrink-0 rounded border border-neblirWarning-200 px-2 py-1 text-xs font-medium text-neblirWarning-200 transition-colors hover:bg-neblirWarning-200/20 disabled:cursor-not-allowed disabled:opacity-50";

const modalClose =
  "shrink-0 rounded p-1.5 text-white transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50";

const modalToolbarAction =
  "shrink-0 rounded-md border-2 border-white bg-transparent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50";

const modalInlineLink =
  "shrink-0 text-xs text-white/70 underline transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50";

const modalMutedPrimary =
  "w-full rounded-md border-2 border-white bg-paleBlue/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-paleBlue/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50";

const modalPaleOutline =
  "rounded-md border-2 border-paleBlue bg-transparent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-paleBlue/40 disabled:cursor-not-allowed disabled:opacity-50";

const modalPalePrimary =
  "rounded-md border-2 border-paleBlue bg-paleBlue px-4 py-2 text-sm font-semibold text-modalBackground-200 transition-colors hover:bg-paleBlue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-paleBlue/50 disabled:cursor-not-allowed disabled:opacity-50";

const modalCloseLight =
  "shrink-0 rounded p-1.5 text-xl leading-none text-black/70 transition-colors hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25 disabled:cursor-not-allowed disabled:opacity-50";

const modalClosePale =
  "shrink-0 rounded p-1.5 text-xl leading-none text-paleBlue transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-paleBlue/35 disabled:cursor-not-allowed disabled:opacity-50";

const lightRowHit =
  "min-w-0 cursor-pointer text-left hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 rounded-sm";

const lightPillAction =
  "w-[4.25rem] overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-black bg-transparent px-1 py-0.5 text-[10px] font-medium text-black transition-colors hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 disabled:cursor-not-allowed disabled:opacity-50";

const lightToolbarCompact =
  "w-fit rounded border border-black bg-transparent px-2 py-1 text-xs font-medium text-black transition-colors hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/35 disabled:cursor-not-allowed disabled:opacity-50";

const lightLinkSubtle =
  "mt-1 text-left text-[10px] font-medium text-black/50 underline underline-offset-2 transition-colors hover:text-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25 disabled:cursor-not-allowed disabled:opacity-50";

const lightChipSafe =
  "rounded border border-neblirSafe-400 px-2 py-1 text-sm text-neblirSafe-600 transition-colors hover:bg-neblirSafe-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neblirSafe-400/40 disabled:cursor-not-allowed disabled:opacity-50";

const lightChipSafeCompact =
  "rounded border border-neblirSafe-400 px-2 py-1 text-xs text-neblirSafe-600 transition-colors hover:bg-neblirSafe-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neblirSafe-400/40 disabled:cursor-not-allowed disabled:opacity-50";

const lightChipDangerCompact =
  "rounded border border-neblirDanger-400 px-2 py-1 text-xs text-neblirDanger-600 transition-colors hover:bg-neblirDanger-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neblirDanger-400/40";

const lightOutlineMuted =
  "rounded border border-black/30 px-3 py-1.5 text-sm text-black transition-colors hover:border-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25";

const lightRollChip =
  "rounded border border-black/30 px-2 py-1 text-sm text-black transition-colors hover:border-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25";

const lightPathCard =
  "rounded border border-black/20 bg-transparent p-3 text-left transition-colors hover:border-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20";

const lightSlotActive =
  "flex-1 rounded border-2 border-customPrimary bg-customPrimary/10 px-2 py-2 text-left text-sm shadow-sm text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimary/40";

const lightSlotIdle =
  "flex-1 rounded border-2 border-black/20 bg-transparent px-2 py-2 text-left text-sm text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20";

const lightCompactXsMuted =
  "rounded border border-black/30 px-2 py-1 text-xs text-black transition-colors hover:border-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20";

const lightChipNeutralMuted =
  "rounded border border-black/20 bg-transparent px-2 py-1 text-xs text-black/40 disabled:cursor-not-allowed";

const lightDisclosureRow =
  "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20";

const lightSquareIcon =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded border-2 border-black text-lg font-semibold text-black transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30";

const lightAttributeDiceRow =
  "flex w-full items-center justify-between gap-4 px-3 py-2.5 text-left text-sm text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset";

const lightSkillDiceRow =
  "flex w-full items-baseline justify-between gap-4 px-3 py-2.5 text-left text-sm text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset";

const lightSpecialSkillRow =
  "flex w-full items-center px-3 py-2.5 text-left text-sm text-black transition-colors hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset";

const lightBrowseRow =
  "flex w-full items-stretch rounded-md border border-black/10 bg-paleBlue/40 px-3 py-2 text-left text-sm text-black transition-colors hover:bg-paleBlue/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:cursor-wait disabled:opacity-70";

const surfaceInherit = "";

const selectTriggerLight =
  "relative flex min-h-11 w-full cursor-pointer items-center rounded-md border-2 border-black/30 bg-paleBlue px-3 py-2 pr-9 text-left text-sm text-black focus:border-customPrimaryHover focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover disabled:cursor-not-allowed disabled:opacity-50";

const selectTriggerModal =
  "relative mt-1 flex w-full min-h-[48px] cursor-pointer items-center rounded border-2 border-white/50 bg-transparent px-3 py-2 pr-9 text-left text-base text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50";

const stepperDotBase =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-medium transition-colors hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 sm:h-7 sm:w-7 sm:text-xs";

const stepperDotComplete = `${stepperDotBase} border-customPrimary bg-customPrimary text-customSecondary`;

const stepperDotCurrent = `${stepperDotBase} border-customPrimary bg-transparent text-customPrimary`;

const stepperDotIdle = `${stepperDotBase} border-black/30 bg-transparent text-black/50 hover:border-black/50 hover:text-black/80`;

const datePickerTrigger =
  "min-w-[10rem] rounded border border-black/20 bg-paleBlue px-3 py-2 text-left text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-paleBlue/60 disabled:text-black/60";

const datePickerMonthNav =
  "rounded p-1.5 text-white/80 transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

const datePickerDay =
  "min-w-[2rem] rounded py-2 text-sm transition-colors text-white hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

const datePickerDayToday =
  "min-w-[2rem] rounded bg-paleBlue/20 py-2 text-sm font-medium text-white transition-colors hover:bg-paleBlue/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

const datePickerClear =
  "mt-3 w-full rounded border border-white/40 py-2 text-xs text-white/80 transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30";

const carouselArrow =
  "p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 disabled:pointer-events-none disabled:opacity-40";

const carouselDotActive =
  "h-2.5 w-2.5 rounded-full bg-customPrimary transition focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-customPrimary";

const carouselDotInactive =
  "h-2 w-2 rounded-full bg-customSecondary/10 transition focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-black/20";

const modalFooterGhostFull =
  "w-full rounded border border-white/40 bg-transparent py-2 text-sm font-medium text-white transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

const modalIconStepperFlatSm =
  "flex h-8 w-8 items-center justify-center rounded border border-white bg-transparent text-white transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40";

const modalIconStepperLg =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

const modalSubtleWhiteBorderBlock =
  "rounded border border-white/30 bg-transparent px-3 py-2 text-sm text-white transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-50";

const modalClosePaleBordered =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded border border-paleBlue/25 text-lg font-medium text-paleBlue transition-colors hover:bg-paleBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-paleBlue/35";

const modalListRowHit =
  "min-w-0 flex-1 rounded text-left transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent";

const primarySm =
  "rounded-md bg-customPrimary px-4 py-2 text-sm font-medium text-customSecondary transition-colors hover:bg-customPrimaryHover focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimary/50 disabled:opacity-50";

const primaryXs =
  "rounded-md bg-customPrimary px-3 py-2 text-xs font-medium text-customSecondary transition-colors hover:bg-customPrimaryHover focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimary/50 disabled:opacity-50";

const secondaryOutlineXs =
  "rounded-md border border-black/30 bg-transparent px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25 disabled:opacity-50";

const lightSectionDisclosure =
  "flex w-full items-center justify-between rounded-sm text-left transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25";

const solidDark =
  "inline-flex items-center justify-center rounded-md border border-black bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-black";

const lightChevronExpand =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/15 text-black/70 transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black";

const lightCombatToggle =
  "col-span-3 flex w-full min-w-0 items-center justify-center rounded-lg border border-black bg-transparent px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-black transition hover:bg-black/10 active:bg-black/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30";

const lightCurrencyAddRow =
  "w-44 rounded border border-black/40 px-2 py-1 text-sm text-black transition-colors hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25";

const lightDangerLink =
  "text-xs text-neblirDanger-600 underline transition-colors hover:text-neblirDanger-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neblirDanger-400/40";

const lightPathTitleLink =
  "text-left text-base font-semibold text-black underline decoration-black/35 underline-offset-2 transition-colors hover:decoration-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30";

const lightDisclosureChevron =
  "shrink-0 rounded p-1 text-xs text-black transition-colors hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25";

const lightTemplateInfoIcon =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded border border-black/30 bg-white/90 text-xs font-bold text-black/80 shadow-sm transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30";

const lightHeaderIconAffordance =
  "flex shrink-0 cursor-pointer items-center justify-center rounded-md text-black transition-opacity hover:opacity-70 active:opacity-55 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2";

const lightNoteListRow =
  "min-w-0 flex-1 flex-col rounded-sm px-1 py-1 text-left -ml-1 transition-colors hover:bg-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

const lightOutlineBlackSm =
  "rounded-md border border-black px-3 py-2 text-xs font-medium text-black transition-colors hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30";

const lightOutlineDangerSm =
  "rounded-md border border-neblirDanger-500 px-3 py-2 text-xs font-medium text-neblirDanger-600 transition-colors hover:bg-neblirDanger-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-neblirDanger-400/40";

const lightOutlineMutedSm =
  "rounded-md border border-black/30 px-3 py-2 text-xs font-medium text-black/80 transition-colors hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25";

const lightRemoveLinkOnPale =
  "shrink-0 text-sm text-black/70 underline transition-colors hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 disabled:opacity-50";

const lightRemoveLinkOnModal =
  "shrink-0 text-sm text-white/80 underline transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50";

const lightReferenceDisclosure =
  "flex w-full items-center justify-between gap-3 rounded-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25";

export const appButtonVariantClassName: Record<AppButtonVariant, string> = {
  primary,
  secondary,
  quiet,
  ghostNav: ghostNavButtonClassName,
  modalFooterPrimary,
  modalFooterSecondary,
  modalIconStepper,
  modalIconStepperSmall,
  modalBlockPrimary,
  modalOptionSelected,
  modalOptionUnselected,
  modalCompactWarning,
  modalClose,
  modalToolbarAction,
  modalInlineLink,
  modalMutedPrimary,
  modalPaleOutline,
  modalPalePrimary,
  modalCloseLight,
  modalClosePale,
  lightRowHit,
  lightPillAction,
  lightToolbarCompact,
  lightLinkSubtle,
  lightChipSafe,
  lightChipSafeCompact,
  lightChipDangerCompact,
  lightOutlineMuted,
  lightRollChip,
  lightPathCard,
  lightSlotActive,
  lightSlotIdle,
  lightCompactXsMuted,
  lightChipNeutralMuted,
  lightDisclosureRow,
  lightSquareIcon,
  lightAttributeDiceRow,
  lightSkillDiceRow,
  lightSpecialSkillRow,
  lightBrowseRow,
  surfaceInherit,
  selectTriggerLight,
  selectTriggerModal,
  stepperDotComplete,
  stepperDotCurrent,
  stepperDotIdle,
  datePickerTrigger,
  datePickerMonthNav,
  datePickerDay,
  datePickerDayToday,
  datePickerClear,
  carouselArrow,
  carouselDotActive,
  carouselDotInactive,
  modalFooterGhostFull,
  modalIconStepperFlatSm,
  modalIconStepperLg,
  modalSubtleWhiteBorderBlock,
  modalClosePaleBordered,
  modalListRowHit,
  primarySm,
  primaryXs,
  secondaryOutlineXs,
  lightSectionDisclosure,
  solidDark,
  lightChevronExpand,
  lightCombatToggle,
  lightCurrencyAddRow,
  lightDangerLink,
  lightPathTitleLink,
  lightDisclosureChevron,
  lightTemplateInfoIcon,
  lightHeaderIconAffordance,
  lightNoteListRow,
  lightOutlineBlackSm,
  lightOutlineDangerSm,
  lightOutlineMutedSm,
  lightRemoveLinkOnPale,
  lightRemoveLinkOnModal,
  lightReferenceDisclosure,
};
