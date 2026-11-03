import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createUniqueVehicle,
  updateUniqueVehicle,
} from "@/lib/api/uniqueVehicles";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const createBody = {
  gameId: "game-1",
  sourceType: "GLOBAL_VEHICLE" as const,
  vehicleId: "veh-1",
};

describe("createUniqueVehicle", () => {
  it("returns the created id from a well-formed body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ id: "uv-1" }, 201))
    );

    await expect(createUniqueVehicle(createBody)).resolves.toEqual({
      id: "uv-1",
    });
  });

  it("rejects a body that is missing id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ vehicleId: "veh-1" }, 201))
    );

    await expect(createUniqueVehicle(createBody)).rejects.toThrow(/id:/);
  });
});

describe("updateUniqueVehicle", () => {
  it("returns the updated record from a well-formed body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          id: "uv-1",
          ownerUserId: "user-1",
          gameId: "game-1",
          sourceType: "STANDALONE",
          nameOverride: "Courier",
        })
      )
    );

    await expect(
      updateUniqueVehicle("uv-1", { nameOverride: "Courier" })
    ).resolves.toEqual({
      id: "uv-1",
      ownerUserId: "user-1",
      gameId: "game-1",
      sourceType: "STANDALONE",
      nameOverride: "Courier",
    });
  });

  it("rejects a body that is missing id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          ownerUserId: "user-1",
          gameId: "game-1",
          sourceType: "STANDALONE",
          nameOverride: "Courier",
        })
      )
    );

    await expect(
      updateUniqueVehicle("uv-1", { nameOverride: "Courier" })
    ).rejects.toThrow(/id:/);
  });
});
