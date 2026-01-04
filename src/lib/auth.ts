import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { UserRole } from "@/types/enums"
import { authConfig } from "./auth.config"

export interface User {
    id: string
    username: string
    nameAr: string
    role: UserRole
    email?: string | null
    ownerId: string | null // For HALL_OWNER: null (they ARE the owner), for team: their owner's ID
}

declare module "next-auth" {
    interface User {
        id: string
        username: string
        nameAr: string
        role: UserRole
        email?: string | null
        ownerId: string | null
    }

    interface Session {
        user: {
            id: string
            username: string
            nameAr: string
            role: UserRole
            email?: string | null
            ownerId: string // Resolved owner ID for all users
        }
    }

    interface JWT {
        id: string
        username: string
        nameAr: string
        role: UserRole
        ownerId: string
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "اسم المستخدم", type: "text" },
                password: { label: "كلمة المرور", type: "password" }
            },
            async authorize(credentials) {
                console.log("🔐 Login attempt for:", credentials?.username);

                if (!process.env.AUTH_SECRET) {
                    console.error("⚠️ AUTH_SECRET is missing in environment variables!");
                }

                if (!credentials?.username || !credentials?.password) {
                    console.log("❌ Missing credentials");
                    throw new Error("يرجى إدخال اسم المستخدم وكلمة المرور")
                }

                try {
                    const user = await prisma.user.findFirst({
                        where: {
                            username: credentials.username as string,
                            status: "ACTIVE"
                        }
                    })

                    if (!user) {
                        console.log("❌ User not found or inactive:", credentials.username);
                        throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة")
                    }

                    console.log("✅ User found:", user.username, user.role);

                    const isValidPassword = await bcrypt.compare(
                        credentials.password as string,
                        user.password
                    )

                    if (!isValidPassword) {
                        console.log("❌ Invalid password for:", user.username);
                        throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة")
                    }

                    console.log("✅ Password valid. Updating last login...");

                    // Update last login
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { lastLogin: new Date() }
                    })

                    // Determine the ownerId for tenant isolation:
                    // - SUPER_ADMIN: keep as null (has access to all)
                    // - HALL_OWNER: their own ID (they are the owner)
                    // - Team members: their owner's ID
                    let resolvedOwnerId: string | null = null

                    if (user.role === 'SUPER_ADMIN') {
                        resolvedOwnerId = null // Super admin sees all
                    } else if (user.role === 'HALL_OWNER') {
                        resolvedOwnerId = user.id // Hall owner IS the owner
                    } else {
                        resolvedOwnerId = user.ownerId // Team member uses their owner's ID
                    }

                    console.log("✅ Login successful, resolved ownerId:", resolvedOwnerId);

                    return {
                        id: user.id,
                        username: user.username,
                        nameAr: user.nameAr,
                        role: user.role as UserRole,
                        email: user.email,
                        ownerId: resolvedOwnerId
                    }
                } catch (error) {
                    console.error("🔥 Auth error:", error);
                    throw error;
                }
            }
        })
    ],
})
