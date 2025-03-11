import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { createDocument, getPlayerByEmail } from "./app/lib/fauna/functions"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [Google],
    callbacks: {
        async jwt({ token, user }) {
            if (user && typeof user.email === 'string') {
                const player = await getPlayerByEmail(user?.email)

                if (!player) {
                    console.info('creating player')
                    if (!user.email || !user.name) {
                        throw new Error('Missing user email or name')
                    }
                    await createDocument('players', { email: user.email, name: user.name })
                    token.player = await getPlayerByEmail(user.email)
                } else {
                    token.player = player
                }

                return token
            }

            return null
        },

        async session({ session, token }) {
            session.user.email = (token.player as { email: string }).email
            session.user.name = (token.player as { name: string }).name

            return session
        }
    }
})