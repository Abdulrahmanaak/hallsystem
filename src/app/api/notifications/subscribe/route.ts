import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Save a push subscription
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await request.json()
        const { endpoint, keys, userAgent } = body

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return NextResponse.json(
                { error: 'Invalid subscription data' },
                { status: 400 }
            )
        }

        // Upsert: update if endpoint exists, create if not
        await prisma.pushSubscription.upsert({
            where: { endpoint },
            update: {
                p256dh: keys.p256dh,
                auth: keys.auth,
                userId: session.user.id,
                userAgent: userAgent || null,
            },
            create: {
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                userId: session.user.id,
                userAgent: userAgent || null,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[PUSH_SUBSCRIBE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// DELETE - Remove a push subscription
export async function DELETE(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await request.json()
        const { endpoint } = body

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Endpoint is required' },
                { status: 400 }
            )
        }

        await prisma.pushSubscription.deleteMany({
            where: { endpoint, userId: session.user.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[PUSH_UNSUBSCRIBE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
