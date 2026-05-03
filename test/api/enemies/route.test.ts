import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const createEnemyMock = vi.fn();
const getEnemiesMock = vi.fn();

vi.mock("@/app/lib/prisma/enemy", () => ({
  createEnemy: createEnemyMock,
  getEnemies: getEnemiesMock,
}));

describe("/api/enemies route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/enemies/route");
    const response = await invokeRoute(GET, makeUnauthedRequest());
    expect(response.status).toBe(401);
    expect(getEnemiesMock).not.toHaveBeenCalled();
  });

  it("GET returns 200 with enemies for authenticated user", async () => {
    getEnemiesMock.mockResolvedValue([{ id: "e-1", name: "Goblin" }]);
    const { GET } = await import("@/app/api/enemies/route");
    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { id: "e-1", name: "Goblin" },
    ]);
  });

  it("GET returns 500 when getEnemies throws", async () => {
    getEnemiesMock.mockRejectedValue(new Error("database unavailable"));
    const { GET } = await import("@/app/api/enemies/route");
    const response = await invokeRoute(GET, makeAuthedRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.message).toBe("Error fetching enemies");
    expect(body.details).toBeDefined();
  });

  it("POST returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/enemies/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({ name: "X" })
    );
    expect(response.status).toBe(401);
    expect(createEnemyMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when body fails schema validation", async () => {
    const { POST } = await import("@/app/api/enemies/route");
    const response = await invokeRoute(POST, makeAuthedRequest({ name: "" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe("Error parsing enemy creation request");
    expect(createEnemyMock).not.toHaveBeenCalled();
  });

  it("POST returns 201 and created enemy on success", async () => {
    const created = {
      id: "e-new",
      name: "Orc",
      health: 20,
      speed: 5,
      initiativeModifier: 0,
      numberOfReactions: 1,
    };
    createEnemyMock.mockResolvedValue(created);
    const { POST } = await import("@/app/api/enemies/route");
    const payload = {
      name: "Orc",
      health: 20,
      speed: 5,
      initiativeModifier: 0,
      numberOfReactions: 1,
    };
    const response = await invokeRoute(POST, makeAuthedRequest(payload));
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(created);
    expect(createEnemyMock).toHaveBeenCalledWith(
      expect.objectContaining(payload)
    );
  });

  it("POST returns 500 when createEnemy throws", async () => {
    createEnemyMock.mockRejectedValue(new Error("unique constraint"));
    const { POST } = await import("@/app/api/enemies/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        name: "Orc",
        health: 20,
        speed: 5,
        initiativeModifier: 0,
        numberOfReactions: 1,
      })
    );
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.message).toBe("Error creating enemy");
    expect(body.details).toBeDefined();
  });
});
