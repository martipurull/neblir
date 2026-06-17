import { beforeEach, describe, expect, it, vi } from "vitest";
import { invokeRoute, makeAuthedRequest } from "../helpers";

const createUserMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/user", () => ({
  createUser: createUserMock,
}));

vi.mock("@/app/lib/types/user", () => ({
  userCreateSchema: { safeParse: safeParseMock },
}));

describe("/api/users POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid payload", async () => {
    safeParseMock.mockReturnValue({
      data: undefined,
      error: { issues: [{ message: "invalid user body" }] },
    });
    const { POST } = await import("@/app/api/users/route");
    const response = await invokeRoute(POST, makeAuthedRequest({ bad: true }));
    expect(response.status).toBe(400);
  });

  it("returns 201 on success", async () => {
    safeParseMock.mockReturnValue({
      data: { email: "a@b.com", name: "A" },
      error: undefined,
    });
    createUserMock.mockResolvedValue({ id: "u-1" });
    const { POST } = await import("@/app/api/users/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ email: "a@b.com", name: "A" })
    );
    expect(response.status).toBe(201);
    expect(createUserMock).toHaveBeenCalledWith({
      email: "a@b.com",
      name: "A",
      characterLayoutMode: undefined,
      characterSectionOrder: undefined,
    });
  });

  it("maps characterSectionOrder to empty array on create when cleared", async () => {
    safeParseMock.mockReturnValue({
      data: {
        email: "a@b.com",
        name: "A",
        characterSectionOrder: null,
      },
      error: undefined,
    });
    createUserMock.mockResolvedValue({ id: "u-1" });
    const { POST } = await import("@/app/api/users/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        email: "a@b.com",
        name: "A",
        characterSectionOrder: null,
      })
    );
    expect(response.status).toBe(201);
    expect(createUserMock).toHaveBeenCalledWith({
      email: "a@b.com",
      name: "A",
      characterLayoutMode: undefined,
      characterSectionOrder: [],
    });
  });

  it("maps characterLayoutMode to db enum on create", async () => {
    safeParseMock.mockReturnValue({
      data: {
        email: "a@b.com",
        name: "A",
        characterLayoutMode: "vertical",
      },
      error: undefined,
    });
    createUserMock.mockResolvedValue({ id: "u-1" });
    const { POST } = await import("@/app/api/users/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        email: "a@b.com",
        name: "A",
        characterLayoutMode: "vertical",
      })
    );
    expect(response.status).toBe(201);
    expect(createUserMock).toHaveBeenCalledWith({
      email: "a@b.com",
      name: "A",
      characterLayoutMode: "VERTICAL",
      characterSectionOrder: undefined,
    });
  });
});
