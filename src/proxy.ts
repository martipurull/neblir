export { auth as proxy } from "@/auth.proxy";

/**
 * Limit proxy to app routes — skip static assets, API handlers, and Serwist.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/data|favicon.ico|manifest.webmanifest|icons/|serwist/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
