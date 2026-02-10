import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const token = req.auth
    const pathname = req.nextUrl.pathname

    // Public paths - no authentication required
    const isPublicPath =
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname.startsWith("/api/auth")

    // Redirect logged-in users from login/signup pages
    if (isPublicPath && token?.user) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Redirect non-logged-in users to login
    if (!isPublicPath && !token?.user) {
        return NextResponse.redirect(new URL("/login", req.url))
    }

    // Role-based access control
    const role = token?.user?.role

    // Super Admin routes - only SUPER_ADMIN
    if (pathname.startsWith("/dashboard/admin") && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Settings routes - HALL_OWNER and SUPER_ADMIN only
    if (pathname.startsWith("/dashboard/settings") &&
        role !== "HALL_OWNER" && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Users management routes - HALL_OWNER and SUPER_ADMIN only
    if (pathname.startsWith("/dashboard/users") &&
        role !== "HALL_OWNER" && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Finance routes - HALL_OWNER, SUPER_ADMIN and Accountant
    if (pathname.startsWith("/dashboard/finance") &&
        role !== "HALL_OWNER" &&
        role !== "SUPER_ADMIN" &&
        role !== "ACCOUNTANT") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Subscription routes - HALL_OWNER and SUPER_ADMIN only
    if (pathname.startsWith("/dashboard/subscription") &&
        role !== "HALL_OWNER" && role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/login",
        "/signup"
    ]
}
