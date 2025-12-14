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
}

declare module "next-auth" {
    interface User {
        id: string
        username: string
        nameAr: string
        role: UserRole
        email?: string | null
    }

    interface Session {
        user: {
            id: string
            username: string
            nameAr: string
            role: UserRole
            email?: string | null
        }
    }

    interface JWT {
        id: string
        username: string
        nameAr: string
        role: UserRole
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

                // ===============================================
                // TEMPORARY MOCK LOGIN BYPASS (Netlify DB Issue)
                // ===============================================
                const mockUsers: Record<string, any> = {
                    'mock_admin': {
                        id: 'mock_admin_1',
                        username: 'mock_admin',
                        nameAr: 'مدير النظام (مؤقت)',
                        role: 'ADMIN',
                        email: 'admin@mock.com'
                    },
                    'mock_supervisor': {
                        id: 'mock_sup_1',
                        username: 'mock_supervisor',
                        nameAr: 'مشرف القاعات (مؤقت)',
                        role: 'ROOM_SUPERVISOR',
                        email: 'sup@mock.com'
                    },
                    'mock_accountant': {
                        id: 'mock_acct_1',
                        username: 'mock_accountant',
                        nameAr: 'محاسب (مؤقت)',
                        role: 'ACCOUNTANT',
                        email: 'acct@mock.com'
                    },
                    'mock_employee': {
                        id: 'mock_emp_1',
                        username: 'mock_employee',
                        nameAr: 'موظف (مؤقت)',
                        role: 'EMPLOYEE',
                        email: 'emp@mock.com'
                    }
                }

                if (credentials?.username && mockUsers[credentials.username as string]) {
                    console.log("⚠️ USING MOCK USER BYPASS FOR:", credentials.username);
                    return mockUsers[credentials.username as string];
                }
                // ===============================================

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

                    console.log("✅ Login successful, returning user object");

                    return {
                        id: user.id,
                        username: user.username,
                        nameAr: user.nameAr,
                        role: user.role as UserRole, // Cast string from DB to UserRole
                        email: user.email
                    }
                } catch (error) {
                    console.error("🔥 Auth error:", error);
                    throw error; // Re-throw to be handled by NextAuth
                }
            }
        })
    ],
})
