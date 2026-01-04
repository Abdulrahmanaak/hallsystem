import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET all users (filtered by owner for HALL_OWNER, all for SUPER_ADMIN)
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Only HALL_OWNER and SUPER_ADMIN can view users
        if (session.user.role !== 'HALL_OWNER' && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 })
        }

        // Build filter based on role
        let whereClause = {}
        if (session.user.role === 'HALL_OWNER') {
            // Hall owner sees themselves and their team members
            whereClause = {
                OR: [
                    { id: session.user.id }, // The hall owner themselves
                    { ownerId: session.user.ownerId } // Their team members
                ]
            }
        }
        // SUPER_ADMIN sees all users (empty whereClause)

        const users = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                username: true,
                nameAr: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                lastLogin: true,
                createdAt: true,
                ownerId: true
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

// POST - Create new team member (HALL_OWNER only)
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Only HALL_OWNER can create team members
        if (session.user.role !== 'HALL_OWNER' && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'فقط صاحب القاعة يمكنه إضافة مستخدمين' }, { status: 403 })
        }

        const body = await request.json()

        // Validate role - HALL_OWNER can only create team roles
        const allowedRoles = ['ROOM_SUPERVISOR', 'ACCOUNTANT', 'EMPLOYEE']
        if (session.user.role === 'HALL_OWNER' && !allowedRoles.includes(body.role)) {
            return NextResponse.json(
                { error: 'لا يمكنك إنشاء هذا النوع من المستخدمين' },
                { status: 400 }
            )
        }

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

        // Create user with ownerId pointing to the hall owner
        const user = await prisma.user.create({
            data: {
                username: body.username,
                password: hashedPassword,
                nameAr: body.nameAr,
                email: body.email || null,
                phone: body.phone || null,
                role: body.role,
                status: body.status || 'ACTIVE',
                ownerId: session.user.ownerId // Auto-assign to hall owner's tenant
            },
            select: {
                id: true,
                username: true,
                nameAr: true,
                role: true,
                status: true,
                ownerId: true
            }
        })

        console.log(`✅ Team member created: ${user.username} (ownerId: ${user.ownerId})`)

        return NextResponse.json(user, { status: 201 })
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        )
    }
}
