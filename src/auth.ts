import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [Google],
    callbacks: {
        // Fetch user from Fauna using the email address
        // If the user doesn't exist, create a new user
        // Attach user data to the session
    }
})