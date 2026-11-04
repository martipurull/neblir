import type { Status } from "@prisma/client";

export type CharacterStatusMark = {
  label: "Alive" | "Deceased" | "Deranged";
  showPill: boolean;
  showCross: boolean;
  fillClassName: string | null;
  borderClassName: string | null;
  textClassName: string | null;
};

const PALE_BLUE_FILL = "bg-paleBlue";

export function characterStatusMark(status: Status): CharacterStatusMark {
  switch (status) {
    case "DECEASED":
      return {
        label: "Deceased",
        showPill: true,
        showCross: true,
        fillClassName: PALE_BLUE_FILL,
        borderClassName: "border-neblirDanger",
        textClassName: "text-neblirDanger-600",
      };
    case "DERANGED":
      return {
        label: "Deranged",
        showPill: true,
        showCross: false,
        fillClassName: PALE_BLUE_FILL,
        borderClassName: "border-neblirWarning",
        textClassName: "text-neblirWarning-600",
      };
    case "ALIVE":
      return {
        label: "Alive",
        showPill: false,
        showCross: false,
        fillClassName: null,
        borderClassName: null,
        textClassName: null,
      };
  }
}

type MarkedStatus = {
  label: string;
  fillClassName: string;
  borderClassName: string;
  textClassName: string;
};

function markedStatus(status: Status): MarkedStatus | null {
  const mark = characterStatusMark(status);
  if (
    !mark.showPill ||
    mark.fillClassName == null ||
    mark.borderClassName == null ||
    mark.textClassName == null
  ) {
    return null;
  }
  return {
    label: mark.label,
    fillClassName: mark.fillClassName,
    borderClassName: mark.borderClassName,
    textClassName: mark.textClassName,
  };
}

type SheetStatusBanner = {
  shellClassName: string;
  labelClassName: string;
  label: string;
};

/** Sheet banner chrome. Colours and wording come from the status mark. */
export function sheetStatusBanner(status: Status): SheetStatusBanner | null {
  const mark = markedStatus(status);
  if (mark == null) return null;
  return {
    label: mark.label,
    shellClassName: `mt-2 w-full rounded-md border ${mark.borderClassName} ${mark.fillClassName} px-3 py-2 text-center`,
    labelClassName: `font-sarpanch text-sm font-bold uppercase tracking-[0.2em] ${mark.textClassName}`,
  };
}

const NPC_STATUS_PILL_CHROME =
  "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";

type NpcCardStatusPill = {
  className: string;
  label: string;
};

/** NPC card pill. Hidden when the status mark does not show a pill. */
export function npcCardStatusPill(status: Status): NpcCardStatusPill | null {
  const mark = markedStatus(status);
  if (mark == null) return null;
  return {
    label: mark.label,
    className: `${NPC_STATUS_PILL_CHROME} ${mark.fillClassName} ${mark.borderClassName} ${mark.textClassName}`,
  };
}
