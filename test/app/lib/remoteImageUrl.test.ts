import { describe, expect, it } from "vitest";
import { resolveRemoteImageUrl } from "@/app/lib/remoteImageUrl";

describe("resolveRemoteImageUrl", () => {
  it("treats a missing key as no image, even if the url map is still empty", () => {
    expect(resolveRemoteImageUrl(null, undefined)).toBeNull();
    expect(resolveRemoteImageUrl("", undefined)).toBeNull();
    expect(resolveRemoteImageUrl(undefined, undefined)).toBeNull();
  });

  it("keeps loading vs ready vs failed when a key exists", () => {
    expect(resolveRemoteImageUrl("avatars/a.png", undefined)).toBeUndefined();
    expect(resolveRemoteImageUrl("avatars/a.png", "https://cdn/a")).toBe(
      "https://cdn/a"
    );
    expect(resolveRemoteImageUrl("avatars/a.png", null)).toBeNull();
  });
});
