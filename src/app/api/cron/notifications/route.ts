import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotificationForTeam, deleteOldNotifications } from '@/lib/services/notification'

const UPCOMING_BOOKING_MILESTONES = [30, 21, 14, 7, 1]

export async function GET(request: Request) {
    try {
        // Validate CRON secret
        const cronSecret = request.headers.get('x-cron-secret')
        if (cronSecret !== process.env.CRON_SECRET) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const now = new Date()
        let upcomingCount = 0
        let reminderCount = 0

        // ==========================================
        // 1. UPCOMING BOOKING NOTIFICATIONS
        // ==========================================
        // For each milestone (30, 21, 14, 7, 1 days), find confirmed bookings
        // within that day window and send notifications if not already sent.

        for (const daysBeforeEvent of UPCOMING_BOOKING_MILESTONES) {
            const targetDate = new Date(now)
            targetDate.setDate(targetDate.getDate() + daysBeforeEvent)

            // Find bookings where eventDate falls on the target day
            const startOfDay = new Date(targetDate)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(targetDate)
            endOfDay.setHours(23, 59, 59, 999)

            const bookings = await prisma.booking.findMany({
                where: {
                    status: 'CONFIRMED',
                    isDeleted: false,
                    eventDate: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
                include: {
                    customer: { select: { nameAr: true } },
                    hall: { select: { nameAr: true } },
                },
            })

            for (const booking of bookings) {
                // Check for deduplication: skip if notification already sent for this booking + milestone
                const existing = await prisma.notification.findFirst({
                    where: {
                        type: 'UPCOMING_BOOKING',
                        ownerId: booking.ownerId,
                        metadata: {
                            contains: `"bookingId":"${booking.id}"`,
                        },
                        AND: {
                            metadata: {
                                contains: `"daysBeforeEvent":${daysBeforeEvent}`,
                            },
                        },
                    },
                })

                if (existing) continue

                const dayLabel = daysBeforeEvent === 1 ? 'غداً' : `بعد ${daysBeforeEvent} يوم`

                await createNotificationForTeam({
                    type: 'UPCOMING_BOOKING',
                    title: `حجز قادم - ${dayLabel}`,
                    message: `حجز ${booking.customer.nameAr} في قاعة ${booking.hall.nameAr} - ${dayLabel}`,
                    ownerId: booking.ownerId,
                    metadata: {
                        bookingId: booking.id,
                        bookingNumber: booking.bookingNumber,
                        daysBeforeEvent,
                    },
                    link: `/dashboard/bookings?id=${booking.id}`,
                })

                upcomingCount++
            }
        }

        // ==========================================
        // 2. PAYMENT REMINDER NOTIFICATIONS
        // ==========================================
        // Find completed bookings with unpaid balance

        const completedBookings = await prisma.booking.findMany({
            where: {
                status: 'COMPLETED',
                isDeleted: false,
                eventDate: { lt: now },
            },
            include: {
                customer: { select: { nameAr: true } },
                hall: { select: { nameAr: true } },
                payments: {
                    where: { isDeleted: false },
                    select: { amount: true },
                },
            },
        })

        for (const booking of completedBookings) {
            const totalPaid = booking.payments.reduce(
                (sum, p) => sum + Number(p.amount),
                0
            )
            const remaining = Number(booking.finalAmount) - totalPaid

            if (remaining <= 0) continue

            // Check if we already sent a payment reminder for this booking (only once)
            const existing = await prisma.notification.findFirst({
                where: {
                    type: 'PAYMENT_REMINDER',
                    ownerId: booking.ownerId,
                    metadata: {
                        contains: `"bookingId":"${booking.id}"`,
                    },
                },
            })

            if (existing) continue

            await createNotificationForTeam({
                type: 'PAYMENT_REMINDER',
                title: 'تذكير بمبلغ متبقي',
                message: `حجز ${booking.customer.nameAr} - المبلغ المتبقي: ${remaining.toLocaleString('ar-SA')} ريال`,
                ownerId: booking.ownerId,
                metadata: {
                    bookingId: booking.id,
                    bookingNumber: booking.bookingNumber,
                    remainingAmount: remaining,
                },
                link: `/dashboard/bookings?id=${booking.id}`,
            })

            reminderCount++
        }

        // ==========================================
        // 3. CLEANUP OLD NOTIFICATIONS
        // ==========================================
        await deleteOldNotifications(90)

        return NextResponse.json({
            success: true,
            upcomingBookingNotifications: upcomingCount,
            paymentReminderNotifications: reminderCount,
        })
    } catch (error) {
        console.error('[CRON_NOTIFICATIONS]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
