import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@/types/enums'
import { sendPushToMany } from './push'
import { sendNotificationEmail } from '@/lib/mail'

// Types that should also send an email
const EMAIL_NOTIFICATION_TYPES: NotificationType[] = [
    'INVOICE_OVERDUE',
    'TRIAL_EXPIRING',
    'BOOKING_CANCELLED',
    'UPCOMING_BOOKING',
    'PAYMENT_REMINDER',
    'SYSTEM',
]

// Role-based recipient rules
const NOTIFICATION_ROLE_MAP: Record<NotificationType, string[]> = {
    NEW_BOOKING: ['HALL_OWNER', 'ROOM_SUPERVISOR'],
    BOOKING_CONFIRMED: ['HALL_OWNER', 'ROOM_SUPERVISOR'],
    BOOKING_CANCELLED: ['HALL_OWNER', 'ROOM_SUPERVISOR'],
    PAYMENT_RECEIVED: ['HALL_OWNER', 'ACCOUNTANT'],
    INVOICE_CREATED: ['HALL_OWNER', 'ACCOUNTANT'],
    INVOICE_OVERDUE: ['HALL_OWNER', 'ACCOUNTANT'],
    UPCOMING_BOOKING: ['HALL_OWNER', 'ROOM_SUPERVISOR'],
    PAYMENT_REMINDER: ['HALL_OWNER', 'ACCOUNTANT'],
    TRIAL_EXPIRING: ['HALL_OWNER'],
    SYSTEM: ['HALL_OWNER', 'ROOM_SUPERVISOR', 'ACCOUNTANT', 'EMPLOYEE'],
}

interface CreateNotificationInput {
    type: NotificationType
    title: string
    message: string
    userId: string
    ownerId: string
    metadata?: Record<string, unknown>
    link?: string
}

// Simple in-memory cache for company settings to reduce DB load
const settingsCache = new Map<string, { email: string | null; expiry: number }>()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

/**
 * Create a single notification for a specific user.
 * Also sends push and email (if applicable) in background.
 */
export async function createNotification(
    input: CreateNotificationInput,
    providedCompanyEmail?: string | null
) {
    // 1. Fetch user preferences
    const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true, notificationPrefs: true },
    })

    const prefs = user?.notificationPrefs
        ? JSON.parse(user.notificationPrefs)
        : { inApp: true, push: true, email: true }

    // 2. Only create in-app notification if enabled
    let notification = null
    if (prefs.inApp) {
        notification = await prisma.notification.create({
            data: {
                type: input.type,
                title: input.title,
                message: input.message,
                metadata: input.metadata ? JSON.stringify(input.metadata) : null,
                link: input.link || null,
                userId: input.userId,
                ownerId: input.ownerId,
            },
        })
    }

    // 3. Send push notification in background if enabled
    if (prefs.push) {
        sendPushToMany([input.userId], {
            title: input.title,
            body: input.message,
            url: input.link || '/dashboard',
        }).then(() => {
            if (notification) {
                prisma.notification.update({
                    where: { id: notification.id },
                    data: { pushSent: true },
                }).catch(() => { /* ignore */ })
            }
        }).catch((err) => console.error('[PUSH_ERROR]', err))
    }

    // 4. Send email for critical notification types if enabled
    if (prefs.email && EMAIL_NOTIFICATION_TYPES.includes(input.type)) {
        let companyEmail = providedCompanyEmail

        // If not provided, check cache or fetch from DB
        if (companyEmail === undefined) {
            const cached = settingsCache.get(input.ownerId)
            if (cached && cached.expiry > Date.now()) {
                companyEmail = cached.email
            } else {
                const settings = await prisma.settings.findUnique({
                    where: { ownerId: input.ownerId },
                    select: { companyEmail: true },
                })
                companyEmail = settings?.companyEmail || null
                settingsCache.set(input.ownerId, {
                    email: companyEmail,
                    expiry: Date.now() + CACHE_TTL
                })
            }
        }

        const emailTarget = companyEmail || user?.email

        if (emailTarget) {
            sendNotificationEmail({
                to: emailTarget,
                title: input.title,
                message: input.message,
                link: input.link,
            }).then(() => {
                if (notification) {
                    prisma.notification.update({
                        where: { id: notification.id },
                        data: { emailSent: true },
                    }).catch(() => { /* ignore */ })
                }
            }).catch((err) => console.error('[EMAIL_ERROR]', err))
        }
    }

    return notification
}

interface TeamNotificationInput {
    type: NotificationType
    title: string
    message: string
    ownerId: string
    metadata?: Record<string, unknown>
    link?: string
    /** Additional user IDs to notify (e.g. original booking creator) */
    extraUserIds?: string[]
}

/**
 * Create notifications for all relevant team members of a tenant,
 * based on notification type role rules.
 */
export async function createNotificationForTeam(input: TeamNotificationInput) {
    const allowedRoles = NOTIFICATION_ROLE_MAP[input.type] || []

    // Fetch company settings once for the whole team
    let companyEmail: string | null = null
    const cached = settingsCache.get(input.ownerId)
    if (cached && cached.expiry > Date.now()) {
        companyEmail = cached.email
    } else {
        const settings = await prisma.settings.findUnique({
            where: { ownerId: input.ownerId },
            select: { companyEmail: true },
        })
        companyEmail = settings?.companyEmail || null
        settingsCache.set(input.ownerId, {
            email: companyEmail,
            expiry: Date.now() + CACHE_TTL
        })
    }

    // Get all team members (including the owner themselves)
    const users = await prisma.user.findMany({
        where: {
            status: 'ACTIVE',
            role: { in: allowedRoles },
            OR: [
                { id: input.ownerId },           // The owner themselves
                { ownerId: input.ownerId },       // Team members
            ],
        },
        select: { id: true },
    })

    const userIds = new Set(users.map((u) => u.id))

    // Add extra user IDs (e.g. original booking creator)
    if (input.extraUserIds) {
        input.extraUserIds.forEach((id) => userIds.add(id))
    }

    const notifications = await Promise.allSettled(
        Array.from(userIds).map((userId) =>
            createNotification(
                {
                    type: input.type,
                    title: input.title,
                    message: input.message,
                    userId,
                    ownerId: input.ownerId,
                    metadata: input.metadata,
                    link: input.link,
                },
                companyEmail // Pass the pre-fetched email to avoid DB hammering
            )
        )
    )

    return notifications
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true, readAt: new Date() },
    })
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
    })
}

/**
 * Get unread count for a user.
 */
export async function getUnreadCount(userId: string) {
    return prisma.notification.count({
        where: { userId, isRead: false },
    })
}

/**
 * Get paginated notifications for a user.
 */
export async function getUserNotifications(
    userId: string,
    options: {
        cursor?: string
        limit?: number
        unreadOnly?: boolean
    } = {}
) {
    const { cursor, limit = 20, unreadOnly = false } = options

    const where = {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
    }

    const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // Fetch one extra to know if there's more
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = notifications.length > limit
    const items = hasMore ? notifications.slice(0, limit) : notifications
    const nextCursor = hasMore ? items[items.length - 1].id : null

    return { items, nextCursor, hasMore }
}

/**
 * Delete notifications older than a given number of days.
 */
export async function deleteOldNotifications(daysOld: number = 90) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysOld)

    return prisma.notification.deleteMany({
        where: { createdAt: { lt: cutoff } },
    })
}
