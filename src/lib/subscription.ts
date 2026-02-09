import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export type SubscriptionState = {
    isExpired: boolean
    isReadOnly: boolean
    daysLeft: number
    inGracePeriod: boolean
    status: string // 'TRIAL' | 'SUBSCRIBED' | 'EXPIRED' | 'CANCELLED' | 'GRACE_PERIOD'
}

/**
 * Checks the subscription status for a user/owner
 */
export async function checkSubscriptionStatus(userId: string): Promise<SubscriptionState> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            ownerId: true,
            trialEndsAt: true,
            subscriptionEndsAt: true,
            subscriptionStatus: true
        }
    })

    if (!user) {
        throw new Error('User not found')
    }

    // Super Admin is always valid
    if (user.role === 'SUPER_ADMIN') {
        return {
            isExpired: false,
            isReadOnly: false,
            daysLeft: 365,
            inGracePeriod: false,
            status: 'SUBSCRIBED'
        }
    }

    // If user is a sub-user, check their owner's status
    if (user.ownerId) {
        return checkSubscriptionStatus(user.ownerId)
    }

    // --- Owner Logic ---
    const now = new Date()
    const { subscriptionStatus, trialEndsAt, subscriptionEndsAt } = user

    let endDate: Date | null = null
    let status = subscriptionStatus || 'TRIAL'

    // determine relevant end date
    if (status === 'SUBSCRIBED' && subscriptionEndsAt) {
        endDate = subscriptionEndsAt
    } else if (trialEndsAt) {
        endDate = trialEndsAt
    }

    // Default 7 days trial if no date set (fallback for weird data states)
    if (!endDate && status === 'TRIAL') {
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }

    // If no date found, assume expired (shouldn't happen for valid users)
    if (!endDate) {
        return {
            isExpired: true,
            isReadOnly: true,
            daysLeft: 0,
            inGracePeriod: false,
            status: 'EXPIRED'
        }
    }

    const diffTime = endDate.getTime() - now.getTime()
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const isExpired = daysLeft < 0

    // Grace Period Logic: 24 hours after expiration
    const gracePeriodHours = 24
    const hoursPastExpiration = Math.abs(diffTime / (1000 * 60 * 60))
    const inGracePeriod = isExpired && hoursPastExpiration <= gracePeriodHours

    return {
        isExpired,
        isReadOnly: isExpired && !inGracePeriod,
        daysLeft: isExpired ? 0 : daysLeft,
        inGracePeriod,
        status: isExpired ? (inGracePeriod ? 'GRACE_PERIOD' : 'EXPIRED') : status
    }
}

/**
 * API Middleware helper to enforce subscription
 * Returns a response if blocked, null if allowed
 */
export async function enforceSubscription(userId: string) {
    try {
        const { isReadOnly } = await checkSubscriptionStatus(userId)

        if (isReadOnly) {
            return NextResponse.json(
                { error: 'عفواً، انتهت فترة التجربة. يرجى الترقية للمتابعة.' },
                { status: 403 }
            )
        }
        return null
    } catch (error) {
        console.error('Subscription check failed:', error)
        return NextResponse.json(
            { error: 'حدث خطأ في التحقق من الاشتراك' },
            { status: 500 }
        )
    }
}
