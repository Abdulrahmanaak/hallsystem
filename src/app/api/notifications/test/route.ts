import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createNotification } from '@/lib/services/notification'

export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        await createNotification({
            type: 'SYSTEM',
            title: 'إشعار تجريبي 🔔',
            message: 'هذا إشعار للتأكد من عمل النظام بنجاح. إذا وصلتك هذه الرسالة، فكل شيء يعمل بشكل ممتاز!',
            userId: session.user.id,
            ownerId: session.user.ownerId,
            link: '/dashboard/notifications',
            metadata: { isTest: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[TEST_NOTIFICATION_ERROR]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
