import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
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
        console.error('❌ Signup error:', error)
        const errMsg = error instanceof Error ? error.message : 'Unknown error'
        const errCode = (error as { code?: string })?.code
        console.error('Error details:', errMsg)
        console.error('Error code:', errCode || 'No code')

        // Return more specific error message for debugging
        let errorMessage = 'حدث خطأ أثناء إنشاء الحساب'

        // Handle Prisma-specific errors
        if (errCode === 'P2002') {
            const meta = (error as { meta?: { target?: string[] } })?.meta
            const field = meta?.target?.[0] || 'field'
            errorMessage = field === 'username'
                ? 'اسم المستخدم موجود مسبقاً'
                : field === 'email'
                    ? 'البريد الإلكتروني مسجل مسبقاً'
                    : 'البيانات موجودة مسبقاً'
        } else if (errCode === 'P2003') {
            errorMessage = 'خطأ في البيانات المرتبطة'
        }

        return NextResponse.json(
            { error: errorMessage, details: errMsg },
            { status: 500 }
        )
    }
}
