import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@hallsystem.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

interface PushPayload {
    title: string
    body: string
    url?: string
    icon?: string
}

/**
 * Send a push notification to a single user (all their subscriptions).
 */
export async function sendPushNotification(userId: string, payload: PushPayload) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.warn('[PUSH] VAPID keys not configured, skipping push notification')
        return
    }

    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
    })

    console.log(`[PUSH_DEBUG] Target User: ${userId}, Subscriptions Found: ${subscriptions.length}`)

    if (subscriptions.length === 0) {
        console.warn(`[PUSH_DEBUG] No push subscriptions found for user ${userId}. Did they enable it in the browser?`)
        return
    }

    const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || '/dashboard',
        icon: payload.icon || '/icon-192.png',
    })

    const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    },
                    pushPayload
                )
            } catch (error: unknown) {
                const statusCode = (error as { statusCode?: number })?.statusCode
                // 410 Gone or 404 = subscription expired, remove it
                if (statusCode === 410 || statusCode === 404) {
                    await prisma.pushSubscription.delete({
                        where: { id: sub.id },
                    }).catch(() => { /* ignore */ })
                }
                throw error
            }
        })
    )

    return results
}

/**
 * Send push notifications to multiple users.
 */
export async function sendPushToMany(userIds: string[], payload: PushPayload) {
    const results = await Promise.allSettled(
        userIds.map((userId) => sendPushNotification(userId, payload))
    )
    return results
}
