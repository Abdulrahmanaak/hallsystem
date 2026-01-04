import type { NextAuthConfig } from "next-auth"
import type { UserRole } from "@/types/enums"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.username = user.username
                token.nameAr = user.nameAr
                token.role = user.role
                // Store resolved ownerId in token
                // For HALL_OWNER: their own ID, for team: owner's ID, for SUPER_ADMIN: null
                token.ownerId = user.ownerId
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.username = token.username as string
                session.user.nameAr = token.nameAr as string
                session.user.role = token.role as UserRole
                // Resolve ownerId for session:
                // For HALL_OWNER: their own user ID
                // For team members: their owner's ID
                // For SUPER_ADMIN: null (will bypass filters)
                session.user.ownerId = (token.ownerId as string) || token.id as string
            }
            return session
        },
        authorized({ auth, request: nextUrl }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.nextUrl.pathname.startsWith('/dashboard')
            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            }
            return true
        },
    },
    providers: [], // Configured in auth.ts
    trustHost: true,
} satisfies NextAuthConfig
