export type RouteHandler = (...args: any[]) => Promise<Response> | Response;

export const GET: RouteHandler;
export const POST: RouteHandler;
export const PATCH: RouteHandler;
export const PUT: RouteHandler;
export const DELETE: RouteHandler;
