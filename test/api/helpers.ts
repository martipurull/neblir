import { vi } from "vitest";

export async function invokeRoute(
  handler: (...args: any[]) => any,
  ...args: any[]
): Promise<Response> {
  return handler(...args);
}

export function makeAuthedRequest(body?: unknown, userId = "user-1") {
  return {
    auth: { user: { id: userId } },
    json: vi.fn().mockResolvedValue(body),
  } as any;
}

export function makeUnauthedRequest(body?: unknown) {
  return {
    auth: null,
    json: vi.fn().mockResolvedValue(body),
  } as any;
}

export function makeParams<T extends Record<string, string>>(params: T) {
  return { params: Promise.resolve(params) } as any;
}
