import { describe, expect, it, vi } from "vitest";

const getHandler = vi.fn();
const postHandler = vi.fn();

vi.mock("@/auth", () => ({
  handlers: {
    GET: getHandler,
    POST: postHandler,
  },
  auth: (handler: unknown) => handler,
}));

describe("/api/auth/[...nextauth] route re-exports", () => {
  it("re-exports GET and POST handlers from auth", async () => {
    const routeModule = await import("@/app/api/auth/[...nextauth]/route");
    expect(routeModule.GET).toBe(getHandler);
    expect(routeModule.POST).toBe(postHandler);
  });
});
