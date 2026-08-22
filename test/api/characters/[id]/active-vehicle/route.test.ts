import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const belongsMock = vi.fn();
const mountMock = vi.fn();
const dismountMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: (...args: unknown[]) => belongsMock(...args),
}));

vi.mock("@/app/lib/prisma/vehicleCharacter", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    mountVehicleForCharacter: (...args: unknown[]) => mountMock(...args),
    dismountVehicleForCharacter: (...args: unknown[]) => dismountMock(...args),
  };
});

describe("PATCH /api/characters/[id]/active-vehicle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mountMock.mockResolvedValue(undefined);
    dismountMock.mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    const { PATCH } =
      await import("@/app/api/characters/[id]/active-vehicle/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 on invalid mount body", async () => {
    belongsMock.mockResolvedValue(true);
    const { PATCH } =
      await import("@/app/api/characters/[id]/active-vehicle/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "mount", vehicleCharacterId: "" }, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 409 when mount is rejected for a non-ridable vehicle", async () => {
    belongsMock.mockResolvedValue(true);
    const { VehicleCharacterConflictError } =
      await import("@/app/lib/prisma/vehicleCharacter");
    mountMock.mockRejectedValue(
      new VehicleCharacterConflictError(
        "Broken-down or beyond-repair vehicles cannot be mounted."
      )
    );
    const { PATCH } =
      await import("@/app/api/characters/[id]/active-vehicle/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "mount", vehicleCharacterId: "vc-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(409);
  });

  it("returns 200 and mounts a vehicle", async () => {
    belongsMock.mockResolvedValue(true);
    const { PATCH } =
      await import("@/app/api/characters/[id]/active-vehicle/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "mount", vehicleCharacterId: "vc-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(mountMock).toHaveBeenCalledWith("char-1", "vc-1");
  });

  it("returns 400 when dismount is missing parkedAt", async () => {
    belongsMock.mockResolvedValue(true);
    const { PATCH } =
      await import("@/app/api/characters/[id]/active-vehicle/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "dismount", parkedAt: "" }, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 200 and dismounts with a persisted parked location", async () => {
    belongsMock.mockResolvedValue(true);
    const { PATCH } =
      await import("@/app/api/characters/[id]/active-vehicle/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "dismount", parkedAt: "North garage" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    expect(dismountMock).toHaveBeenCalledWith("char-1", "North garage");
    await expect(response.json()).resolves.toEqual({
      activeVehicleCharacterId: null,
      parkedAt: "North garage",
    });
  });
});
