import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markAsRead } from '@/lib/services/notification'

export async function PATCH(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await request.json()
        if (!body.id) {
            return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
        }

        await markAsRead(body.id, session.user.id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[NOTIFICATION_READ]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
