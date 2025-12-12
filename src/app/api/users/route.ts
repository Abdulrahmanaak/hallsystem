import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET all users
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                nameAr: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                lastLogin: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}

// POST - Create new user
export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Check if username already exists
        const existingUser = await prisma.user.findUnique({
            where: { username: body.username }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'اسم المستخدم موجود مسبقاً' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(body.password, 10)

        const user = await prisma.user.create({
            data: {
                username: body.username,
                password: hashedPassword,
                nameAr: body.nameAr,
                email: body.email || null,
                phone: body.phone || null,
                role: body.role,
                status: body.status || 'ACTIVE'
            },
            select: {
                id: true,
                username: true,
                nameAr: true,
                role: true,
                status: true
            }
        })

        return NextResponse.json(user, { status: 201 })
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        )
    }
}
