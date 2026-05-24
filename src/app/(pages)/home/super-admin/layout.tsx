import { getUser } from "@/app/lib/prisma/user";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const user = await getUser(session.user.id);
  if (user?.role !== "SUPER_ADMIN") {
    redirect("/home");
  }

  return <>{children}</>;
}
