import NextAuth from "next-auth";
import type { User } from "next-auth";
import { parseSuperAdminEmailSet } from "./app/lib/authz/superAdmin";
import { createUser, getUserByEmail, updateUser } from "./app/lib/prisma/user";
import authConfig from "./auth.config";

function toSessionUser(
  dbUser: NonNullable<Awaited<ReturnType<typeof getUserByEmail>>>
): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role ?? undefined,
    characters: [],
  };
}

export const { handlers, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user && typeof user.email === "string") {
        const existingUser = await getUserByEmail(user?.email);

        if (!existingUser) {
          console.info("creating user");
          if (!user.email || !user.name) {
            throw new Error("Missing user email or name");
          }
          await createUser({ email: user.email, name: user.name });
        } else {
          console.info("user already exists");
        }

        const superEmails = parseSuperAdminEmailSet();
        if (superEmails.has(user.email.toLowerCase())) {
          const dbUser = await getUserByEmail(user.email);
          if (dbUser && dbUser.role !== "SUPER_ADMIN") {
            await updateUser(dbUser.id, { role: "SUPER_ADMIN" });
          }
        }

        const dbUser = await getUserByEmail(user.email);
        if (!dbUser) {
          throw new Error("User not found after sign-in");
        }
        token.user = toSessionUser(dbUser);

        return token;
      }

      return token;
    },

    async session({ session, token }) {
      const jwtUser = token.user as User | undefined;
      if (jwtUser) {
        session.user.id = jwtUser.id;
        session.user.email = jwtUser.email;
        session.user.name = jwtUser.name;
        session.user.role = jwtUser.role;
        session.user.characters = jwtUser.characters;
      }

      return session;
    },
  },
});
