import NextAuth from "next-auth";
import authConfig from "./auth.config";

/** Proxy-only Auth.js instance (no Prisma). Re-exported from `proxy.ts`. */
export const { auth } = NextAuth(authConfig);
