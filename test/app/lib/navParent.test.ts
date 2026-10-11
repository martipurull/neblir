import { describe, expect, it } from "vitest";
import {
  characterLevelUpHref,
  characterSheetHref,
  characterUpdateHref,
  createCharacterHref,
  loreEntryHref,
  resolveNavParent,
  type NavParent,
  type NavParentQuery,
  type NavParentTitles,
} from "@/app/lib/navParent";

function parent(
  pathname: string,
  query: NavParentQuery = {},
  titles: NavParentTitles = {}
): NavParent {
  return resolveNavParent(pathname, query, titles);
}

const hidden = { hidden: true } as const;
const gameTitles = { gameTitle: "Midnight Run" };
const characterTitles = { characterTitle: "Aria Vale" };

describe("resolveNavParent", () => {
  it("hides Dashboard and unknown paths", () => {
    expect(parent("/home")).toEqual(hidden);
    expect(parent("/home/")).toEqual(hidden);
    expect(parent("/")).toEqual(hidden);
    expect(parent("/home/not-a-page")).toEqual(hidden);
    expect(parent("/home/games/g1/gm/enemies")).toEqual(hidden);
    expect(parent("/home/super-admin/items/extra")).toEqual(hidden);
    expect(parent("/home/characters/c1/missing")).toEqual(hidden);
  });

  it.each([
    ["/home/settings", "/home", "← Dashboard"],
    ["/home/characters", "/home", "← Dashboard"],
    ["/home/games", "/home", "← Dashboard"],
    ["/home/mechanics", "/home", "← Dashboard"],
    ["/home/world", "/home", "← Dashboard"],
    ["/home/maps", "/home", "← Dashboard"],
    ["/home/super-admin", "/home", "← Dashboard"],
    ["/home/games/create", "/home/games", "← Games"],
    ["/home/games/g1", "/home/games", "← Games"],
  ])("%s links to %s as %s", (pathname, href, label) => {
    expect(parent(pathname)).toEqual({ href, label });
  });

  it("ignores a trailing slash on a mapped path", () => {
    expect(parent("/home/settings/")).toEqual({
      href: "/home",
      label: "← Dashboard",
    });
  });

  it.each([
    ["/home/games/g1/characters"],
    ["/home/games/g1/known-npcs"],
    ["/home/games/g1/custom-items"],
    ["/home/games/g1/custom-vehicles"],
    ["/home/games/g1/lore"],
    ["/home/games/g1/files"],
    ["/home/games/g1/recaps"],
    ["/home/games/g1/gm"],
  ])("sends %s to the game, named with the game title", (pathname) => {
    expect(parent(pathname, {}, gameTitles)).toEqual({
      href: "/home/games/g1",
      label: "← Midnight Run",
    });
  });

  it("names an untitled game Game", () => {
    expect(parent("/home/games/g1/files", {}, { gameTitle: "  " })).toEqual({
      href: "/home/games/g1",
      label: "← Game",
    });
  });

  it("sends custom item and vehicle create to those lists", () => {
    expect(
      parent("/home/games/g1/custom-items/create", {}, gameTitles)
    ).toEqual({
      href: "/home/games/g1/custom-items",
      label: "← Custom items",
    });
    expect(
      parent("/home/games/g1/custom-vehicles/create", {}, gameTitles)
    ).toEqual({
      href: "/home/games/g1/custom-vehicles",
      label: "← Custom vehicles",
    });
  });

  it("sends Table Settings and an enemy instance to Game master", () => {
    expect(parent("/home/games/g1/gm/table-settings")).toEqual({
      href: "/home/games/g1/gm",
      label: "← Game master",
    });
    expect(parent("/home/games/g1/gm/enemies/enemy1")).toEqual({
      href: "/home/games/g1/gm",
      label: "← Game master",
    });
  });

  it.each([
    ["items", "Items"],
    ["paths", "Paths"],
    ["features", "Features"],
    ["enemies", "Enemies"],
    ["vehicles", "Vehicles"],
    ["maps", "Maps"],
    ["reference", "Reference"],
  ])(
    "sends super-admin %s create, browse, and created to Super admin, and edit to browse",
    (domain, label) => {
      const hub = { href: "/home/super-admin", label: "← Super admin" };
      expect(parent(`/home/super-admin/${domain}`)).toEqual(hub);
      expect(parent(`/home/super-admin/${domain}/browse`)).toEqual(hub);
      expect(parent(`/home/super-admin/${domain}/created`)).toEqual(hub);
      expect(parent(`/home/super-admin/${domain}/row1/edit`)).toEqual({
        href: `/home/super-admin/${domain}/browse`,
        label: `← ${label}`,
      });
    }
  );

  it.each([
    ["/home/characters", "← Characters"],
    ["/home/games/g1", "← Midnight Run"],
    ["/home/games/g1/characters", "← Player Characters"],
    ["/home/games/g1/known-npcs", "← Known NPCs"],
    ["/home/games/g1/gm", "← Game master"],
  ])(
    "keeps an allowed return target %s on an owned sheet",
    (returnTo, label) => {
      expect(parent("/home/characters/c1", { returnTo }, gameTitles)).toEqual({
        href: returnTo,
        label,
      });
    }
  );

  it("keeps a return target that names another game on an owned sheet", () => {
    expect(
      parent(
        "/home/characters/c1",
        { returnTo: "/home/games/g2/gm" },
        { gameTitle: "Other Table" }
      )
    ).toEqual({
      href: "/home/games/g2/gm",
      label: "← Game master",
    });
  });

  it("falls back to Characters when an owned sheet has no return target or an illegal one", () => {
    expect(parent("/home/characters/c1")).toEqual({
      href: "/home/characters",
      label: "← Characters",
    });
    expect(
      parent("/home/characters/c1", { returnTo: "/home/super-admin" })
    ).toEqual({
      href: "/home/characters",
      label: "← Characters",
    });
    expect(
      parent("/home/characters/c1", {
        returnTo: "https://evil.test/home/characters",
      })
    ).toEqual({
      href: "/home/characters",
      label: "← Characters",
    });
    expect(
      parent("/home/characters/c1", { returnTo: "//evil.test/home/characters" })
    ).toEqual({
      href: "/home/characters",
      label: "← Characters",
    });
    expect(
      parent("/home/characters/c1", { returnTo: "/home/games/g1/gm?x=1" })
    ).toEqual({
      href: "/home/characters",
      label: "← Characters",
    });
    expect(
      parent("/home/characters/c1", { returnTo: "/home/characters#sheet" })
    ).toEqual({
      href: "/home/characters",
      label: "← Characters",
    });
  });

  it("ignores a trailing slash on an allowed return target", () => {
    expect(
      parent(
        "/home/characters/c1",
        { returnTo: "/home/games/g1/gm/" },
        gameTitles
      )
    ).toEqual({
      href: "/home/games/g1/gm",
      label: "← Game master",
    });
  });

  it.each([
    ["/home/games/g1", "← Midnight Run"],
    ["/home/games/g1/characters", "← Player Characters"],
    ["/home/games/g1/known-npcs", "← Known NPCs"],
    ["/home/games/g1/gm", "← Game master"],
  ])(
    "keeps a same-game return target %s on a game-scoped sheet",
    (returnTo, label) => {
      expect(
        parent("/home/games/g1/characters/c1", { returnTo }, gameTitles)
      ).toEqual({ href: returnTo, label });
    }
  );

  it("falls back to Player Characters when a game-scoped return target is missing or names another game", () => {
    expect(parent("/home/games/g1/characters/c1")).toEqual({
      href: "/home/games/g1/characters",
      label: "← Player Characters",
    });
    expect(
      parent("/home/games/g1/characters/c1", {
        returnTo: "/home/games/g2/known-npcs",
      })
    ).toEqual({
      href: "/home/games/g1/characters",
      label: "← Player Characters",
    });
  });

  it("sends Update and Level-up to the sheet and keeps a validated return target", () => {
    expect(
      parent(
        "/home/characters/c1/update",
        { returnTo: "/home/games/g1/gm" },
        characterTitles
      )
    ).toEqual({
      href: "/home/characters/c1?returnTo=%2Fhome%2Fgames%2Fg1%2Fgm",
      label: "← Aria Vale",
    });
    expect(
      parent(
        "/home/characters/c1/level-up",
        { returnTo: "/home/games/g1/known-npcs" },
        characterTitles
      )
    ).toEqual({
      href: "/home/characters/c1?returnTo=%2Fhome%2Fgames%2Fg1%2Fknown-npcs",
      label: "← Aria Vale",
    });
  });

  it("names a blank character Character on Update", () => {
    expect(
      parent("/home/characters/c1/update", {}, { characterTitle: "   " })
    ).toEqual({
      href: "/home/characters/c1",
      label: "← Character",
    });
  });

  it("drops an illegal return target from Update and Level-up", () => {
    expect(
      parent("/home/characters/c1/level-up", {
        returnTo: "/home/super-admin",
      })
    ).toEqual({
      href: "/home/characters/c1",
      label: "← Character",
    });
  });

  it("sends Create to an allowed return target for the game being created into", () => {
    expect(
      parent("/home/characters/create", {
        gameId: "g1",
        returnTo: "/home/games/g1/gm",
      })
    ).toEqual({
      href: "/home/games/g1/gm",
      label: "← Game master",
    });
    expect(
      parent("/home/characters/create", {
        gameId: "g1",
        returnTo: "/home/games/g1/known-npcs",
      })
    ).toEqual({
      href: "/home/games/g1/known-npcs",
      label: "← Known NPCs",
    });
    expect(
      parent("/home/characters/create", {
        returnTo: "/home/characters",
      })
    ).toEqual({
      href: "/home/characters",
      label: "← Characters",
    });
  });

  it("falls back to Characters when Create has no game or the return target names another game", () => {
    expect(parent("/home/characters/create")).toEqual({
      href: "/home/characters",
      label: "← Characters",
    });
    expect(
      parent("/home/characters/create", {
        returnTo: "/home/games/g1/gm",
      })
    ).toEqual({
      href: "/home/characters",
      label: "← Characters",
    });
    expect(
      parent("/home/characters/create", {
        gameId: "g1",
        returnTo: "/home/games/g2/gm",
      })
    ).toEqual({
      href: "/home/characters",
      label: "← Characters",
    });
  });

  it("sends a lore entry to Lore or Table Settings in the same game", () => {
    expect(parent("/home/games/g1/lore/e1")).toEqual({
      href: "/home/games/g1/lore",
      label: "← Lore",
    });
    expect(
      parent("/home/games/g1/lore/e1", {
        returnTo: "/home/games/g1/lore",
      })
    ).toEqual({
      href: "/home/games/g1/lore",
      label: "← Lore",
    });
    expect(
      parent("/home/games/g1/lore/e1", {
        returnTo: "/home/games/g1/gm/table-settings",
      })
    ).toEqual({
      href: "/home/games/g1/gm/table-settings",
      label: "← Table Settings",
    });
  });

  it("falls back to Lore when the return target is another game or the Game master page", () => {
    expect(
      parent("/home/games/g1/lore/e1", {
        returnTo: "/home/games/g2/lore",
      })
    ).toEqual({
      href: "/home/games/g1/lore",
      label: "← Lore",
    });
    expect(
      parent("/home/games/g1/lore/e1", {
        returnTo: "/home/games/g1/gm",
      })
    ).toEqual({
      href: "/home/games/g1/lore",
      label: "← Lore",
    });
  });
});

describe("nav parent href builders", () => {
  it("omits an illegal return target and keeps a valid one on a sheet", () => {
    expect(
      characterSheetHref({
        characterId: "c1",
        returnTo: "https://evil.test",
      })
    ).toBe("/home/characters/c1");
    expect(
      characterSheetHref({
        characterId: "c1",
        returnTo: "/home/games/g2/gm",
      })
    ).toBe("/home/characters/c1?returnTo=%2Fhome%2Fgames%2Fg2%2Fgm");
    expect(
      characterSheetHref({
        characterId: "c1",
        gameId: "g1",
        returnTo: "/home/games/g2/known-npcs",
      })
    ).toBe("/home/games/g1/characters/c1");
    expect(
      characterSheetHref({
        characterId: "c1",
        gameId: "g1",
        returnTo: "/home/games/g1/known-npcs",
      })
    ).toBe(
      "/home/games/g1/characters/c1?returnTo=%2Fhome%2Fgames%2Fg1%2Fknown-npcs"
    );
  });

  it("omits an illegal return target from Create and keeps a matching one", () => {
    expect(createCharacterHref({ fresh: true })).toBe(
      "/home/characters/create?fresh=1"
    );
    expect(
      createCharacterHref({
        fresh: true,
        gameId: "g1",
        returnTo: "/home/games/g2/gm",
        gameLinkIsPublic: false,
      })
    ).toBe("/home/characters/create?fresh=1&gameId=g1&gameLinkIsPublic=0");
    expect(
      createCharacterHref({
        fresh: true,
        gameId: "g1",
        returnTo: "/home/games/g1/gm",
        gameLinkIsPublic: true,
      })
    ).toBe(
      "/home/characters/create?fresh=1&gameId=g1&returnTo=%2Fhome%2Fgames%2Fg1%2Fgm&gameLinkIsPublic=1"
    );
  });

  it("omits an illegal lore return target", () => {
    expect(
      loreEntryHref({
        gameId: "g1",
        entryId: "e1",
        returnTo: "/home/games/g1/gm",
      })
    ).toBe("/home/games/g1/lore/e1");
    expect(
      loreEntryHref({
        gameId: "g1",
        entryId: "e1",
        returnTo: "/home/games/g1/gm/table-settings",
      })
    ).toBe(
      "/home/games/g1/lore/e1?returnTo=%2Fhome%2Fgames%2Fg1%2Fgm%2Ftable-settings"
    );
  });

  it("carries a validated return target onto Update and Level-up", () => {
    expect(
      characterUpdateHref({
        characterId: "c1",
        returnTo: "/home/games/g1/gm",
      })
    ).toBe("/home/characters/c1/update?returnTo=%2Fhome%2Fgames%2Fg1%2Fgm");
    expect(
      characterLevelUpHref({
        characterId: "c1",
        returnTo: "/home/games/g1/known-npcs",
      })
    ).toBe(
      "/home/characters/c1/level-up?returnTo=%2Fhome%2Fgames%2Fg1%2Fknown-npcs"
    );
    expect(
      characterUpdateHref({
        characterId: "c1",
        returnTo: "/home/super-admin",
      })
    ).toBe("/home/characters/c1/update");
  });
});
