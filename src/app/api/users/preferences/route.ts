import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { notificationPrefs: true }
        })

        if (!user) {
            return new NextResponse('User not found', { status: 404 })
        }

        // Parse JSON or return default
        const prefs = user.notificationPrefs 
            ? JSON.parse(user.notificationPrefs) 
            : { inApp: true, push: true, email: true }

        return NextResponse.json(prefs)
    } catch (error) {
        console.error('[USER_PREFERENCES_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await request.json()
        const { inApp, push, email } = body

        // Validate and merge with existing to avoid data loss
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { notificationPrefs: true }
        })

        const currentPrefs = user?.notificationPrefs 
            ? JSON.parse(user.notificationPrefs) 
            : { inApp: true, push: true, email: true }

        const newPrefs = {
            inApp: inApp ?? currentPrefs.inApp,
            push: push ?? currentPrefs.push,
            email: email ?? currentPrefs.email,
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                notificationPrefs: JSON.stringify(newPrefs)
            }
        })

        return NextResponse.json(newPrefs)
    } catch (error) {
        console.error('[USER_PREFERENCES_PATCH]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
