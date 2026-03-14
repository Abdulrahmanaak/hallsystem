import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUnreadCount } from '@/lib/services/notification'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const count = await getUnreadCount(session.user.id)

        return NextResponse.json({ count })
    } catch (error) {
        console.error('[NOTIFICATION_COUNT]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
