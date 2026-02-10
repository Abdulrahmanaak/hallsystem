import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        const { id } = (await params)

        // Security check: Only SUPER_ADMIN can manage subscriptions
        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
        }

        const body = await request.json()
        const { action, days } = body
        // action: 'EXTEND_TRIAL' | 'SET_YEARLY' | 'CANCEL'

        const now = new Date()
        let updateData: Record<string, Date | string | null> = {}

        if (action === 'EXTEND_TRIAL') {
            const extensionDays = days || 7
            // If already in trial, add to existing date, otherwise from now
            const user = await prisma.user.findUnique({ where: { id }, select: { trialEndsAt: true } })
            const baseDate = (user?.trialEndsAt && user.trialEndsAt > now) ? user.trialEndsAt : now

            updateData = {
                trialEndsAt: new Date(baseDate.getTime() + extensionDays * 24 * 60 * 60 * 1000),
                subscriptionStatus: 'TRIAL',
                subscriptionEndsAt: null
            }
        } else if (action === 'SET_YEARLY') {
            updateData = {
                subscriptionEndsAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
                subscriptionStatus: 'SUBSCRIBED',
                trialEndsAt: null // Clear trial
            }
        } else if (action === 'CANCEL') {
            // Set dates to yesterday to effectively expire them
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            updateData = {
                subscriptionStatus: 'CANCELLED',
                subscriptionEndsAt: yesterday,
                trialEndsAt: yesterday
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json({ success: true, user: updatedUser })

    } catch (error) {
        console.error('Error updating subscription:', error)
        return NextResponse.json(
            { error: 'حدث خطأ أثناء تحديث الاشتراك' },
            { status: 500 }
        )
    }
}
