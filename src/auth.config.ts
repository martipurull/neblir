import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge/proxy-safe Auth.js config (no Prisma or other Node-only imports).
 * Shared with `auth.ts`; keep this file free of Prisma / Node-only imports.
 * @see https://authjs.dev/getting-started/migrating-to-v5#edge-compatibility
 */
export default {
  providers: [Google],
  trustHost: true,
} satisfies NextAuthConfig;
