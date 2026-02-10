import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(request: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const body = await request.json()
        const { nameAr, oldPassword, newPassword } = body

        // Fetch current user
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) {
            return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
        }

        const updateData: Record<string, string> = {}

        // 1. Update Name
        if (nameAr && nameAr !== user.nameAr) {
            updateData.nameAr = nameAr
        }

        // 2. Update Password
        if (newPassword) {
            if (!oldPassword) {
                return NextResponse.json(
                    { error: 'يرجى إدخال كلمة المرور الحالية لتغيير كلمة المرور' },
                    { status: 400 }
                )
            }

            const isMatch = await bcrypt.compare(oldPassword, user.password)
            if (!isMatch) {
                return NextResponse.json(
                    { error: 'كلمة المرور الحالية غير صحيحة' },
                    { status: 400 }
                )
            }

            updateData.password = await bcrypt.hash(newPassword, 10)
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: 'لا توجد تغييرات' })
        }

        await prisma.user.update({
            where: { id: user.id },
            data: updateData
        })

        return NextResponse.json({ success: true, message: 'تم تحديث الملف الشخصي بنجاح' })

    } catch (error) {
        console.error('Profile update error:', error)
        return NextResponse.json(
            { error: 'فشل تحديث الملف الشخصي' },
            { status: 500 }
        )
    }
}
