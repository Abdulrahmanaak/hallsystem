import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markAllAsRead } from '@/lib/services/notification'

export async function PATCH() {
    try {
        const session = await auth()
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        await markAllAsRead(session.user.id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[NOTIFICATION_READ_ALL]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
