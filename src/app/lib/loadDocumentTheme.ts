import { cache } from "react";
import { prisma } from "@/app/lib/prisma/client";
import { resolveDocumentTheme, type Theme } from "@/app/lib/theme";
import { auth } from "@/auth";

/** Loads the document Theme for this request. Signed-out requests are Neblir and do not read a user. */
export const loadDocumentTheme = cache(async (): Promise<Theme> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return resolveDocumentTheme({ hasSession: false });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { theme: true },
  });

  return resolveDocumentTheme({
    hasSession: true,
    stored: user?.theme,
  });
});
