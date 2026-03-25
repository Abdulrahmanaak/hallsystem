import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimit, getClientId } from '@/lib/rate-limit'

export async function POST(request: Request) {
    // Strict rate limit for auth: 5 req/min
    const limited = await rateLimit(`signup:${getClientId(request)}`, { maxRequests: 5, windowMs: 60_000 })
    if (limited) return limited

    try {
        const body = await request.json()

        const { nameAr, username, password, email, phone, commercialRegNo, vatRegNo } = body

        // Validate required fields
        if (!nameAr || !username || !password || !email || !phone) {
            return NextResponse.json(
                { error: 'جميع الحقول المطلوبة يجب تعبئتها' },
                { status: 400 }
            )
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
                { status: 400 }
            )
        }

        // Check if username already exists
        const existingUsername = await prisma.user.findUnique({
            where: { username }
        })

        if (existingUsername) {
            return NextResponse.json(
                { error: 'اسم المستخدم موجود مسبقاً' },
                { status: 400 }
            )
        }

        // Check if email already exists
        const existingEmail = await prisma.user.findUnique({
            where: { email }
        })

        if (existingEmail) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني مسجل مسبقاً' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create hall owner user (ownerId is null for hall owners - they are the owner)
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                nameAr,
                email,
                phone: phone || null,
                role: 'HALL_OWNER',
                status: 'ACTIVE',
                // Initialize 7-day trial
                trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                subscriptionStatus: 'TRIAL',
                ownerId: null, // Hall owners have null ownerId
                commercialRegNo: commercialRegNo || null,
                vatRegNo: vatRegNo || null
            },
            select: {
                id: true,
                username: true,
                nameAr: true,
                email: true,
                role: true
            }
        })

        // Create default settings for the new hall owner
        await prisma.settings.create({
            data: {
                ownerId: user.id,
                companyNameAr: nameAr,
                companyEmail: email,
                companyPhone: phone || null,
                commercialRegNo: commercialRegNo || null,
                vatRegNo: vatRegNo || null
            }
        })


        return NextResponse.json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح',
            user: {
                id: user.id,
                username: user.username,
                nameAr: user.nameAr
            }
        }, { status: 201 })

    } catch (error: unknown) {
        const { handlePrismaError } = await import('@/lib/api-error')
        return handlePrismaError(error, 'Signup')
    }
}
