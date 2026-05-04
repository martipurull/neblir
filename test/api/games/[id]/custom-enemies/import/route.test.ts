import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  customEnemyCsvHeaderLine,
  serializeCustomEnemyRowToCsvLine,
} from "@/app/lib/enemyCsv";
import {
  invokeRoute,
  makeAuthedFormDataRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const createCustomEnemyMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/customEnemy", () => ({
  createCustomEnemy: createCustomEnemyMock,
}));

const header =
  "name,description,imageKey,health,speed,initiativeModifier,numberOfReactions,defenceMelee,defenceRange,defenceGrid,attackMelee,attackRange,attackThrow,attackGrid,immunities,resistances,vulnerabilities,notes";

function csvBlob(content: string) {
  return new Blob([content], { type: "text/csv" });
}

describe("POST /api/games/[id]/custom-enemies/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/import/route"
    );
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
    expect(createCustomEnemyMock).not.toHaveBeenCalled();
  });

  it("returns 400 when game id is empty", async () => {
    const fd = new FormData();
    fd.set("file", csvBlob(`${header}\nX,,,1,1,0,0,0,0,0,0,0,0,0,,,,`));
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/import/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedFormDataRequest(fd, "gm-1"),
      makeParams({ id: "" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when game not found", async () => {
    getGameMock.mockResolvedValue(null);
    const fd = new FormData();
    fd.set("file", csvBlob(`${header}\nX,,,1,1,0,0,0,0,0,0,0,0,0,,,,`));
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/import/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedFormDataRequest(fd, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 403 when caller is not game master", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const fd = new FormData();
    fd.set("file", csvBlob(`${header}\nX,,,1,1,0,0,0,0,0,0,0,0,0,,,,`));
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/import/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedFormDataRequest(fd, "player-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 400 when file field is missing", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const fd = new FormData();
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/import/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedFormDataRequest(fd, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toContain("file");
  });

  it("returns 400 when file field is a plain string (not uploaded file)", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const fd = new FormData();
    fd.set("file", "not-a-blob");
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/import/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedFormDataRequest(fd, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when CSV parses to zero rows with errors only", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const fd = new FormData();
    fd.set("file", csvBlob(`${header}\n,,,1,1,0,0,0,0,0,0,0,0,0,,,,`));
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/import/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedFormDataRequest(fd, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.created).toBe(0);
    expect(body.rowErrors?.length).toBeGreaterThan(0);
  });

  it("returns 200 with created count when all rows succeed", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    createCustomEnemyMock.mockResolvedValue({ id: "new-1" });
    const fd = new FormData();
    fd.set(
      "file",
      csvBlob(
        `${customEnemyCsvHeaderLine()}\nAlpha,,,5,5,0,0,0,0,0,0,0,0,0,,,,,,\nBeta,,,5,5,0,0,0,0,0,0,0,0,0,,,,,,`
      )
    );
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/import/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedFormDataRequest(fd, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.created).toBe(2);
    expect(body.skipped).toBe(0);
    expect(createCustomEnemyMock).toHaveBeenCalledTimes(2);
    expect(createCustomEnemyMock.mock.calls[0][0]).toMatchObject({
      gameId: "g-1",
      name: "Alpha",
      actions: [],
      additionalActions: [],
    });
  });

  it("passes actions from CSV cells to createCustomEnemy", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    createCustomEnemyMock.mockResolvedValue({ id: "new-1" });
    const row = serializeCustomEnemyRowToCsvLine({
      name: "Wolf",
      description: null,
      imageKey: null,
      health: 5,
      speed: 5,
      initiativeModifier: 0,
      numberOfReactions: 0,
      defenceMelee: 0,
      defenceRange: 0,
      defenceGrid: 0,
      attackMelee: 0,
      attackRange: 0,
      attackThrow: 0,
      attackGrid: 0,
      immunities: [],
      resistances: [],
      vulnerabilities: [],
      notes: null,
      actions: [{ name: "Bite", numberOfDiceToHit: 1, damageType: "BLADE" }],
      additionalActions: [],
    });
    const fd = new FormData();
    fd.set("file", csvBlob(`${customEnemyCsvHeaderLine()}\n${row}`));
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/import/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedFormDataRequest(fd, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    expect(createCustomEnemyMock).toHaveBeenCalledTimes(1);
    expect(createCustomEnemyMock.mock.calls[0][0].actions).toEqual([
      { name: "Bite", numberOfDiceToHit: 1, damageType: "BLADE" },
    ]);
    expect(createCustomEnemyMock.mock.calls[0][0].additionalActions).toEqual(
      []
    );
  });

  it("returns 200 with skipped rows when one row fails validation after parse", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    createCustomEnemyMock.mockResolvedValue({ id: "new-1" });
    const fd = new FormData();
    fd.set(
      "file",
      csvBlob(
        `${header}\nGood,,,5,5,0,0,0,0,0,0,0,0,0,,,,\nBadName,,,-1,5,0,0,0,0,0,0,0,0,0,,,,`
      )
    );
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/import/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedFormDataRequest(fd, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.created).toBe(1);
    expect(body.skipped).toBe(1);
    expect(body.rowErrors.length).toBeGreaterThanOrEqual(1);
  });

  it("returns 200 with importErrors when createCustomEnemy throws for a row", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    createCustomEnemyMock
      .mockRejectedValueOnce(new Error("duplicate name"))
      .mockResolvedValueOnce({ id: "new-2" });
    const fd = new FormData();
    fd.set(
      "file",
      csvBlob(
        `${header}\nFirst,,,5,5,0,0,0,0,0,0,0,0,0,,,,\nSecond,,,5,5,0,0,0,0,0,0,0,0,0,,,,`
      )
    );
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/import/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedFormDataRequest(fd, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.created).toBe(1);
    expect(
      body.rowErrors.some((e: { message: string }) =>
        e.message.includes("duplicate")
      )
    ).toBe(true);
  });

  it("returns 500 when formData throws", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/import/route"
    );
    const response = await invokeRoute(
      POST,
      {
        auth: { user: { id: "gm-1" } },
        formData: vi.fn().mockRejectedValue(new Error("multipart corrupt")),
      } as any,
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.message).toBe("Error importing custom enemies");
  });
});
