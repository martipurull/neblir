export { auth as proxy } from "@/auth";

/**
 * Limit proxy to app routes — skip static assets, API handlers, and Serwist.
 * Without this, auth runs on every _next/static request and enlarges the traced bundle.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/data|favicon.ico|manifest.webmanifest|icons/|serwist/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
