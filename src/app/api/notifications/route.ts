import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserNotifications } from '@/lib/services/notification'

export async function GET(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const cursor = searchParams.get('cursor') || undefined
        const limit = parseInt(searchParams.get('limit') || '20')
        const unreadOnly = searchParams.get('unreadOnly') === 'true'

        const result = await getUserNotifications(session.user.id, {
            cursor,
            limit,
            unreadOnly,
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('[NOTIFICATIONS_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
