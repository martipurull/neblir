import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge/proxy-safe Auth.js config (no Prisma or other Node-only imports).
 * Used by `proxy.ts` on Vercel; full DB callbacks live in `auth.ts`.
 * @see https://authjs.dev/getting-started/migrating-to-v5#edge-compatibility
 */
export default {
  providers: [Google],
  trustHost: true,
} satisfies NextAuthConfig;
