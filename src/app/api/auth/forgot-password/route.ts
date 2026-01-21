import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/mail'
import crypto from 'crypto'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني مطلوب' },
                { status: 400 }
            )
        }

        // Check if user exists
        const user = await prisma.user.findFirst({
            where: { email }
        })

        if (!user) {
            // For security, don't reveal if user exists, but here we might want to be helpful
            // returning success to avoid enumeration, but realistically for internal apps exact error helps.
            // Let's stick to generic success or check requirements.
            // Plan said: "If user is found but not an owner, return specific error message".
            return NextResponse.json(
                { error: 'البريد الإلكتروني غير مسجل' },
                { status: 404 }
            )
        }

        // Check Role Constraint: Hall Owner or Super Admin only
        if (user.role !== 'HALL_OWNER' && user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'عذراً، استعادة كلمة المرور متاحة فقط لأصحاب القاعات. يرجى التواصل مع المشرف لتغيير كلمة المرور.' },
                { status: 403 }
            )
        }

        // Generate Token
        // Using crypto for a secure random token
        const token = crypto.randomBytes(32).toString('hex')
        const expires = new Date(Date.now() + 3600 * 1000) // 1 hour

        // Save to DB
        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expires
            }
        })

        // Send Email
        const emailResult = await sendPasswordResetEmail(email, token)

        if (!emailResult.success) {
            console.error('Failed to send email:', emailResult.error)
            return NextResponse.json(
                { error: 'فشل إرسال البريد الإلكتروني. يرجى المحاولة لاحقاً.' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' })

    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ غير متوقع' },
            { status: 500 }
        )
    }
}
