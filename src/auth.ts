import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { parseSuperAdminEmailSet } from "./app/lib/authz/superAdmin";
import { createUser, getUserByEmail, updateUser } from "./app/lib/prisma/user";
import type { AdapterUser } from "next-auth/adapters";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
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

        token.user = (await getUserByEmail(user.email)) as AdapterUser;

        return token;
      }

      return token;
    },

    async session({ session, token }) {
      session.user = token.user as AdapterUser;

      return session;
    },

    // authorized: async ({ auth, request }) => {
    //     return !!auth
    // },
  },
});
