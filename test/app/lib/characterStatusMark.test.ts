import { describe, expect, it } from "vitest";
import {
  characterStatusMark,
  npcCardStatusPill,
  sheetStatusBanner,
  type CharacterStatusMark,
} from "@/app/lib/characterStatusMark";

function sharedMarkColours(mark: CharacterStatusMark): {
  fillClassName: string;
  borderClassName: string;
  textClassName: string;
} {
  expect(mark.fillClassName).toEqual(expect.any(String));
  expect(mark.borderClassName).toEqual(expect.any(String));
  expect(mark.textClassName).toEqual(expect.any(String));
  if (
    mark.fillClassName == null ||
    mark.borderClassName == null ||
    mark.textClassName == null
  ) {
    throw new Error("expected shared mark colours");
  }
  return {
    fillClassName: mark.fillClassName,
    borderClassName: mark.borderClassName,
    textClassName: mark.textClassName,
  };
}

describe("characterStatusMark", () => {
  it("describes Deceased as a pale blue pill with a danger border and danger text", () => {
    expect(characterStatusMark("DECEASED")).toEqual({
      label: "Deceased",
      showPill: true,
      showCross: true,
      fillClassName: "bg-paleBlue",
      borderClassName: "border-neblirDanger",
      textClassName: "text-neblirDanger-600",
    });
  });

  it("describes Deranged as a pale blue pill with a warning border and warning text", () => {
    expect(characterStatusMark("DERANGED")).toEqual({
      label: "Deranged",
      showPill: true,
      showCross: false,
      fillClassName: "bg-paleBlue",
      borderClassName: "border-neblirWarning",
      textClassName: "text-neblirWarning-600",
    });
  });

  it("describes Alive with no pill and no shared mark colours", () => {
    expect(characterStatusMark("ALIVE")).toEqual({
      label: "Alive",
      showPill: false,
      showCross: false,
      fillClassName: null,
      borderClassName: null,
      textClassName: null,
    });
  });

  it("shows the portrait × for Deceased and hides it for Deranged and Alive", () => {
    expect(characterStatusMark("DECEASED").showCross).toBe(true);
    expect(characterStatusMark("DERANGED").showCross).toBe(false);
    expect(characterStatusMark("ALIVE").showCross).toBe(false);
  });
});

describe("sheetStatusBanner", () => {
  it("reads the Deceased status mark and stays a banner", () => {
    const mark = characterStatusMark("DECEASED");
    const colours = sharedMarkColours(mark);
    const banner = sheetStatusBanner("DECEASED");

    expect(banner?.label).toBe(mark.label);
    expect(banner?.shellClassName).toContain(colours.fillClassName);
    expect(banner?.shellClassName).toContain(colours.borderClassName);
    expect(banner?.shellClassName).toContain("rounded-md");
    expect(banner?.shellClassName).not.toContain("rounded-full");
    expect(banner?.labelClassName).toContain(colours.textClassName);
  });

  it("reads the Deranged status mark and stays a banner", () => {
    const mark = characterStatusMark("DERANGED");
    const colours = sharedMarkColours(mark);
    const banner = sheetStatusBanner("DERANGED");

    expect(banner?.label).toBe(mark.label);
    expect(banner?.shellClassName).toContain(colours.fillClassName);
    expect(banner?.shellClassName).toContain(colours.borderClassName);
    expect(banner?.labelClassName).toContain(colours.textClassName);
  });

  it("gives Alive no sheet banner", () => {
    expect(sheetStatusBanner("ALIVE")).toBeNull();
  });
});

describe("npcCardStatusPill", () => {
  it("reads the Deceased status mark and stays a pill", () => {
    const mark = characterStatusMark("DECEASED");
    const colours = sharedMarkColours(mark);
    const pill = npcCardStatusPill("DECEASED");

    expect(pill?.label).toBe(mark.label);
    expect(pill?.className).toContain(colours.fillClassName);
    expect(pill?.className).toContain(colours.borderClassName);
    expect(pill?.className).toContain(colours.textClassName);
    expect(pill?.className).toContain("rounded-full");
    expect(pill?.className).not.toContain("rounded-md");
  });

  it("reads the Deranged status mark and stays a pill", () => {
    const mark = characterStatusMark("DERANGED");
    const colours = sharedMarkColours(mark);
    const pill = npcCardStatusPill("DERANGED");

    expect(pill?.label).toBe(mark.label);
    expect(pill?.className).toContain(colours.fillClassName);
    expect(pill?.className).toContain(colours.borderClassName);
    expect(pill?.className).toContain(colours.textClassName);
  });

  it("gives Alive no NPC card pill", () => {
    expect(npcCardStatusPill("ALIVE")).toBeNull();
  });
});
