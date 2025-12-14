import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const token = req.auth
    const pathname = req.nextUrl.pathname

    // Public paths
    const isPublicPath = pathname === "/login" || pathname.startsWith("/api/auth")

    // Redirect logged-in users from login page
    if (isPublicPath && token?.user) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Redirect non-logged-in users to login
    if (!isPublicPath && !token?.user) {
        return NextResponse.redirect(new URL("/login", req.url))
    }

    // Role-based access control (flexible for future changes)
    const role = token?.user?.role

    // Admin-only routes
    if (pathname.startsWith("/dashboard/settings") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Admin-only routes - users management
    if (pathname.startsWith("/dashboard/users") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Finance routes - Admin and Accountant only
    if (pathname.startsWith("/dashboard/finance") &&
        role !== "ADMIN" &&
        role !== "ACCOUNTANT") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/login"
    ]
}
