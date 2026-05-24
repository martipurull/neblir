import { prisma } from "@/app/lib/prisma/client";

/**
 * Emails listed in `SUPER_ADMIN_EMAILS` (comma-separated) are promoted to
 * `SUPER_ADMIN` on sign-in. You can also set `role` manually in the database.
 */
export function parseSuperAdminEmailSet(): Set<string> {
  const raw = process.env.SUPER_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function userIsSuperAdmin(
  userId: string | undefined | null
): Promise<boolean> {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "SUPER_ADMIN";
}
