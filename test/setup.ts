import { vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: (handler: unknown) => handler,
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
}));

vi.mock("@/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
