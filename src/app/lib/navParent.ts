import { resolveEntityPageTitle } from "@/app/lib/pageTitle";

/**
 * Explicit parent for the /home nav control.
 * Pure: no fetch, no membership, no history.
 */

const ID_SOURCE = "[A-Za-z0-9_-]+";
const ID_PATTERN = new RegExp(`^${ID_SOURCE}$`);

const OWNED_EDITOR = new RegExp(
  `^/home/characters/(${ID_SOURCE})/(update|level-up)$`
);
const OWNED_SHEET = new RegExp(`^/home/characters/(${ID_SOURCE})$`);
const GAME_SHEET = new RegExp(
  `^/home/games/(${ID_SOURCE})/characters/(${ID_SOURCE})$`
);
const CUSTOM_ITEM_CREATE = new RegExp(
  `^/home/games/(${ID_SOURCE})/custom-items/create$`
);
const CUSTOM_VEHICLE_CREATE = new RegExp(
  `^/home/games/(${ID_SOURCE})/custom-vehicles/create$`
);
const TABLE_SETTINGS = new RegExp(
  `^/home/games/(${ID_SOURCE})/gm/table-settings$`
);
const ENEMY_INSTANCE = new RegExp(
  `^/home/games/(${ID_SOURCE})/gm/enemies/(${ID_SOURCE})$`
);
const LORE_ENTRY = new RegExp(
  `^/home/games/(${ID_SOURCE})/lore/(${ID_SOURCE})$`
);
const GAME_CHILD = new RegExp(
  `^/home/games/(${ID_SOURCE})/(characters|known-npcs|custom-items|custom-vehicles|lore|files|recaps|gm)$`
);
const GAME_PAGE = new RegExp(`^/home/games/(${ID_SOURCE})$`);
const CATALOGUE_DOMAIN = "items|paths|features|enemies|vehicles|maps|reference";
const CATALOGUE_SECTION = new RegExp(
  `^/home/super-admin/(${CATALOGUE_DOMAIN})$`
);
const CATALOGUE_SIBLING = new RegExp(
  `^/home/super-admin/(${CATALOGUE_DOMAIN})/(browse|created)$`
);
const CATALOGUE_EDIT = new RegExp(
  `^/home/super-admin/(${CATALOGUE_DOMAIN})/(${ID_SOURCE})/edit$`
);

const DASHBOARD_CHILDREN = new Set([
  "/home/settings",
  "/home/characters",
  "/home/games",
  "/home/mechanics",
  "/home/world",
  "/home/maps",
  "/home/super-admin",
]);

const CATALOGUE_LABEL = {
  items: "Items",
  paths: "Paths",
  features: "Features",
  enemies: "Enemies",
  vehicles: "Vehicles",
  maps: "Maps",
  reference: "Reference",
} as const;

type CatalogueDomain = keyof typeof CATALOGUE_LABEL;

export type NavParentQuery = {
  returnTo?: string | null;
  gameId?: string | null;
};

export type NavParentTitles = {
  gameTitle?: string | null;
  characterTitle?: string | null;
};

type NavParentLink = {
  href: string;
  label: string;
};

export type NavParent = NavParentLink | { hidden: true };

const HIDDEN: NavParent = { hidden: true };

const GAME_SCOPED_RETURN_KINDS = [
  "game",
  "player-characters",
  "known-npcs",
  "game-master",
] as const;

type GameScopedReturnKind = (typeof GAME_SCOPED_RETURN_KINDS)[number];

type CharacterReturn =
  | { kind: "characters"; gameId: null }
  | { kind: GameScopedReturnKind; gameId: string };

type GameScopedReturn = {
  pattern: RegExp;
  href: (gameId: string) => string;
  title: (titles: NavParentTitles) => string;
};

const GAME_SCOPED_RETURNS: Record<GameScopedReturnKind, GameScopedReturn> = {
  game: {
    pattern: GAME_PAGE,
    href: (gameId) => `/home/games/${gameId}`,
    title: (titles) => resolveEntityPageTitle(titles.gameTitle, "Game"),
  },
  "player-characters": {
    pattern: new RegExp(`^/home/games/(${ID_SOURCE})/characters$`),
    href: (gameId) => `/home/games/${gameId}/characters`,
    title: () => "Player Characters",
  },
  "known-npcs": {
    pattern: new RegExp(`^/home/games/(${ID_SOURCE})/known-npcs$`),
    href: (gameId) => `/home/games/${gameId}/known-npcs`,
    title: () => "Known NPCs",
  },
  "game-master": {
    pattern: new RegExp(`^/home/games/(${ID_SOURCE})/gm$`),
    href: (gameId) => `/home/games/${gameId}/gm`,
    title: () => "Game master",
  },
};

type ReturnScope =
  | { mode: "any-game" }
  | { mode: "same-game"; gameId: string }
  | { mode: "characters-only" };

function hidden(): NavParent {
  return HIDDEN;
}

function parentLink(href: string, title: string): NavParentLink {
  return { href, label: `← ${title}` };
}

function validId(id: string | null | undefined): string | null {
  if (id == null || !ID_PATTERN.test(id)) return null;
  return id;
}

function isCatalogueDomain(value: string): value is CatalogueDomain {
  return Object.prototype.hasOwnProperty.call(CATALOGUE_LABEL, value);
}

function normalizePath(pathname: string): string {
  const withoutHash = pathname.split("#")[0] ?? "";
  const withoutQuery = withoutHash.split("?")[0] ?? "";
  if (!withoutQuery.startsWith("/")) return withoutQuery;
  const stripped = withoutQuery.replace(/\/+$/, "");
  return stripped.length > 0 ? stripped : "/";
}

function normalizeReturnTarget(raw: string | null | undefined): string | null {
  if (raw == null || raw.length === 0) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (
    raw.includes("?") ||
    raw.includes("#") ||
    raw.includes("\\") ||
    raw.includes("://") ||
    /\s/.test(raw)
  ) {
    return null;
  }
  const stripped = raw.replace(/\/+$/, "");
  return stripped.length > 0 ? stripped : null;
}

function parseCharacterReturn(path: string): CharacterReturn | null {
  if (path === "/home/characters") {
    return { kind: "characters", gameId: null };
  }
  for (const kind of GAME_SCOPED_RETURN_KINDS) {
    const gameId = GAME_SCOPED_RETURNS[kind].pattern.exec(path)?.[1];
    if (gameId) return { kind, gameId };
  }
  return null;
}

function acceptCharacterReturn(
  raw: string | null | undefined,
  scope: ReturnScope
): CharacterReturn | null {
  const path = normalizeReturnTarget(raw);
  if (!path) return null;
  const parsed = parseCharacterReturn(path);
  if (!parsed) return null;
  if (parsed.kind === "characters") return parsed;
  if (scope.mode === "characters-only") return null;
  if (scope.mode === "same-game" && parsed.gameId !== scope.gameId) return null;
  return parsed;
}

function characterReturnHref(target: CharacterReturn): string {
  if (target.kind === "characters") return "/home/characters";
  return GAME_SCOPED_RETURNS[target.kind].href(target.gameId);
}

function characterReturnTitle(
  target: CharacterReturn,
  titles: NavParentTitles
): string {
  if (target.kind === "characters") return "Characters";
  return GAME_SCOPED_RETURNS[target.kind].title(titles);
}

function parentForCharacterReturn(
  target: CharacterReturn,
  titles: NavParentTitles
): NavParentLink {
  return parentLink(
    characterReturnHref(target),
    characterReturnTitle(target, titles)
  );
}

function withReturnTo(path: string, returnTo: string | null): string {
  if (!returnTo) return path;
  const params = new URLSearchParams();
  params.set("returnTo", returnTo);
  return `${path}?${params.toString()}`;
}

function acceptLoreReturn(
  raw: string | null | undefined,
  gameId: string
): string | null {
  const path = normalizeReturnTarget(raw);
  if (!path) return null;
  const lore = `/home/games/${gameId}/lore`;
  const tableSettings = `/home/games/${gameId}/gm/table-settings`;
  if (path === lore || path === tableSettings) return path;
  return null;
}

export function characterSheetHref(input: {
  characterId: string;
  gameId?: string | null;
  returnTo?: string | null;
}): string {
  const gameId = validId(input.gameId);
  const accepted = acceptCharacterReturn(
    input.returnTo,
    gameId ? { mode: "same-game", gameId } : { mode: "any-game" }
  );
  const path = gameId
    ? `/home/games/${gameId}/characters/${input.characterId}`
    : `/home/characters/${input.characterId}`;
  return withReturnTo(path, accepted ? characterReturnHref(accepted) : null);
}

export function createCharacterHref(
  input: {
    gameId?: string | null;
    returnTo?: string | null;
    fresh?: boolean;
    gameLinkIsPublic?: boolean;
  } = {}
): string {
  const gameId = validId(input.gameId);
  const accepted = acceptCharacterReturn(
    input.returnTo,
    gameId ? { mode: "same-game", gameId } : { mode: "characters-only" }
  );
  const params = new URLSearchParams();
  if (input.fresh) params.set("fresh", "1");
  if (gameId) params.set("gameId", gameId);
  if (accepted) params.set("returnTo", characterReturnHref(accepted));
  if (input.gameLinkIsPublic != null) {
    params.set("gameLinkIsPublic", input.gameLinkIsPublic ? "1" : "0");
  }
  const qs = params.toString();
  return qs ? `/home/characters/create?${qs}` : "/home/characters/create";
}

export function loreEntryHref(input: {
  gameId: string;
  entryId: string;
  returnTo?: string | null;
}): string {
  const path = `/home/games/${input.gameId}/lore/${input.entryId}`;
  return withReturnTo(path, acceptLoreReturn(input.returnTo, input.gameId));
}

function ownedCharacterEditorHref(
  characterId: string,
  editor: "update" | "level-up",
  returnTo: string | null | undefined
): string {
  return withReturnTo(
    `/home/characters/${characterId}/${editor}`,
    acceptedOwnedReturnPath(returnTo)
  );
}

export function characterUpdateHref(input: {
  characterId: string;
  returnTo?: string | null;
}): string {
  return ownedCharacterEditorHref(input.characterId, "update", input.returnTo);
}

export function characterLevelUpHref(input: {
  characterId: string;
  returnTo?: string | null;
}): string {
  return ownedCharacterEditorHref(
    input.characterId,
    "level-up",
    input.returnTo
  );
}

export function linkedCharacterSheetHref(input: {
  characterId: string;
  gameId: string;
  ownedByCurrentUser: boolean;
  returnTo?: string | null;
}): string {
  return characterSheetHref({
    characterId: input.characterId,
    gameId: input.ownedByCurrentUser ? null : input.gameId,
    returnTo: input.returnTo,
  });
}

export function gmLinkedCharacterSheetHref(input: {
  characterId: string;
  gameId: string;
  ownedByCurrentUser: boolean;
}): string {
  return linkedCharacterSheetHref({
    ...input,
    returnTo: GAME_SCOPED_RETURNS["game-master"].href(input.gameId),
  });
}

function acceptedOwnedReturnPath(
  raw: string | null | undefined
): string | null {
  const accepted = acceptCharacterReturn(raw, { mode: "any-game" });
  return accepted ? characterReturnHref(accepted) : null;
}

function charactersFallback(): NavParentLink {
  return parentLink("/home/characters", "Characters");
}

function ownedSheetParent(
  query: NavParentQuery,
  titles: NavParentTitles
): NavParent {
  const accepted = acceptCharacterReturn(query.returnTo, { mode: "any-game" });
  return accepted
    ? parentForCharacterReturn(accepted, titles)
    : charactersFallback();
}

function gameSheetParent(
  gameId: string,
  query: NavParentQuery,
  titles: NavParentTitles
): NavParent {
  const accepted = acceptCharacterReturn(query.returnTo, {
    mode: "same-game",
    gameId,
  });
  return accepted
    ? parentForCharacterReturn(accepted, titles)
    : parentLink(`/home/games/${gameId}/characters`, "Player Characters");
}

function createParent(
  query: NavParentQuery,
  titles: NavParentTitles
): NavParent {
  const gameId = validId(query.gameId);
  const accepted = acceptCharacterReturn(
    query.returnTo,
    gameId ? { mode: "same-game", gameId } : { mode: "characters-only" }
  );
  return accepted
    ? parentForCharacterReturn(accepted, titles)
    : charactersFallback();
}

function editorParent(
  characterId: string,
  query: NavParentQuery,
  titles: NavParentTitles
): NavParent {
  return parentLink(
    characterSheetHref({ characterId, returnTo: query.returnTo }),
    resolveEntityPageTitle(titles.characterTitle, "Character")
  );
}

function loreParent(gameId: string, query: NavParentQuery): NavParent {
  const tableSettings = `/home/games/${gameId}/gm/table-settings`;
  const href =
    acceptLoreReturn(query.returnTo, gameId) ?? `/home/games/${gameId}/lore`;
  return parentLink(href, href === tableSettings ? "Table Settings" : "Lore");
}

function gamePageParent(gameId: string, titles: NavParentTitles): NavParent {
  return parentLink(
    `/home/games/${gameId}`,
    resolveEntityPageTitle(titles.gameTitle, "Game")
  );
}

export function resolveNavParent(
  pathname: string,
  query: NavParentQuery = {},
  titles: NavParentTitles = {}
): NavParent {
  const path = normalizePath(pathname);
  if (path === "/home" || path === "/") return hidden();
  if (DASHBOARD_CHILDREN.has(path)) return parentLink("/home", "Dashboard");
  if (path === "/home/games/create") return parentLink("/home/games", "Games");
  if (path === "/home/characters/create") return createParent(query, titles);

  const editor = OWNED_EDITOR.exec(path);
  if (editor?.[1]) return editorParent(editor[1], query, titles);

  const owned = OWNED_SHEET.exec(path);
  if (owned?.[1]) return ownedSheetParent(query, titles);

  const gameSheet = GAME_SHEET.exec(path);
  if (gameSheet?.[1]) return gameSheetParent(gameSheet[1], query, titles);

  const customItemCreate = CUSTOM_ITEM_CREATE.exec(path);
  if (customItemCreate?.[1]) {
    return parentLink(
      `/home/games/${customItemCreate[1]}/custom-items`,
      "Custom items"
    );
  }

  const customVehicleCreate = CUSTOM_VEHICLE_CREATE.exec(path);
  if (customVehicleCreate?.[1]) {
    return parentLink(
      `/home/games/${customVehicleCreate[1]}/custom-vehicles`,
      "Custom vehicles"
    );
  }

  const tableSettings = TABLE_SETTINGS.exec(path);
  if (tableSettings?.[1]) {
    return parentLink(`/home/games/${tableSettings[1]}/gm`, "Game master");
  }

  const enemy = ENEMY_INSTANCE.exec(path);
  if (enemy?.[1])
    return parentLink(`/home/games/${enemy[1]}/gm`, "Game master");

  const lore = LORE_ENTRY.exec(path);
  if (lore?.[1]) return loreParent(lore[1], query);

  const child = GAME_CHILD.exec(path);
  if (child?.[1]) return gamePageParent(child[1], titles);

  if (GAME_PAGE.exec(path)) return parentLink("/home/games", "Games");

  if (CATALOGUE_SECTION.exec(path) || CATALOGUE_SIBLING.exec(path)) {
    return parentLink("/home/super-admin", "Super admin");
  }

  const edit = CATALOGUE_EDIT.exec(path);
  const domain = edit?.[1];
  if (domain && isCatalogueDomain(domain)) {
    return parentLink(
      `/home/super-admin/${domain}/browse`,
      CATALOGUE_LABEL[domain]
    );
  }

  return hidden();
}

export function navParentTitleIds(
  pathname: string,
  query: NavParentQuery = {}
): { gameId: string | null; characterId: string | null } {
  const parent = resolveNavParent(pathname, query, {});
  const gameId =
    "href" in parent ? (GAME_PAGE.exec(parent.href)?.[1] ?? null) : null;
  const characterId = OWNED_EDITOR.exec(normalizePath(pathname))?.[1] ?? null;
  return { gameId, characterId };
}
