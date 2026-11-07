import { afterEach, describe, expect, it, vi } from "vitest";
import { getItem } from "@/lib/api/items";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const siikeGun = {
  id: "item-1",
  type: "GENERAL_ITEM",
  accessType: "PLAYER",
  name: "Siike Gun",
  description: "A compact sidearm.",
  confCost: 120,
  weight: 1,
  botActions: [],
};

describe("getItem", () => {
  it("returns the parsed catalogue item", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(siikeGun)));

    await expect(getItem("item-1")).resolves.toEqual(siikeGun);
  });

  it("rejects an item missing its name", async () => {
    const { name: _name, ...withoutName } = siikeGun;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(withoutName))
    );

    await expect(getItem("item-1")).rejects.toThrow(/name/);
  });
});
