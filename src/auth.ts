import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { createUser, getUserByEmail } from "./app/lib/prisma/user"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [Google],
    callbacks: {
        async jwt({ token, user }) {
            if (user && typeof user.email === 'string') {
                const existingUser = await getUserByEmail(user?.email)

                if (!existingUser) {
                    console.info('creating user')
                    if (!user.email || !user.name) {
                        throw new Error('Missing user email or name')
                    }
                    await createUser({ email: user.email, name: user.name })
                    token.user = await getUserByEmail(user.email)
                } else {
                    console.log('user already exists')
                    token.user = existingUser
                }

                return token
            }

            return null
        },

        async session({ session, token }) {
            session.user.email = (token.user as { email: string }).email
            session.user.name = (token.user as { name: string }).name

            return session
        }
    }
})