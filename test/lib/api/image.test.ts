import { afterEach, describe, expect, it, vi } from "vitest";
import { getImageUrl } from "@/lib/api/image";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("getImageUrl", () => {
  it("returns the signed url from a well-formed body", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ url: "https://cdn.example/items/shard.png" })
        )
    );

    await expect(getImageUrl("items/shard.png")).resolves.toBe(
      "https://cdn.example/items/shard.png"
    );
  });

  it("rejects a body that is missing url", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ imageKey: "items/shard.png" }))
    );

    await expect(getImageUrl("items/shard.png")).rejects.toThrow(/url:/);
  });
});
