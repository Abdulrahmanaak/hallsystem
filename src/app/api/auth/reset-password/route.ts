import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const { token, newPassword } = await request.json()

        if (!token || !newPassword) {
            return NextResponse.json(
                { error: 'البيانات غير مكتملة' },
                { status: 400 }
            )
        }

        // Verify Token
        const existingToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        })

        if (!existingToken) {
            return NextResponse.json(
                { error: 'الرابط غير صالح أو منتهي الصلاحية' },
                { status: 400 }
            )
        }

        // Check Expiration
        if (existingToken.expires < new Date()) {
            await prisma.passwordResetToken.delete({ where: { token } }) // Cleanup
            return NextResponse.json(
                { error: 'الرابط منتهي الصلاحية' },
                { status: 400 }
            )
        }

        // Find User
        const user = await prisma.user.findFirst({
            where: { email: existingToken.email }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'المستخدم غير موجود' },
                { status: 404 }
            )
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update User
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        })

        // Delete Token (and potentially all tokens for this email to invalidate others)
        await prisma.passwordResetToken.delete({
            where: { token }
        })

        // Also delete any other tokens for this email?
        await prisma.passwordResetToken.deleteMany({
            where: { email: user.email! } // safe assertion as we found by email
        })

        return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' })

    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ أثناء تغيير كلمة المرور' },
            { status: 500 }
        )
    }
}
