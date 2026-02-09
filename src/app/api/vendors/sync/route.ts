import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

import { enforceSubscription } from '@/lib/subscription'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check Subscription
        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const ownerId = session.user.role === 'HALL_OWNER' ? session.user.id : session.user.ownerId
        if (!ownerId) return NextResponse.json({ error: 'No Owner ID' }, { status: 500 })

        // Get Qoyod settings
        const settings = await prisma.settings.findUnique({
            where: { ownerId }
        })

        if (!settings?.qoyodApiKey) {
            return NextResponse.json({ error: 'Qoyod API Key not configured' }, { status: 400 })
        }

        const qoyodBaseUrl = process.env.QOYOD_BASE_URL || 'https://api.qoyod.com/2.0'

        // Fetch vendors from Qoyod
        // Using /vendors endpoint for Qoyod v2.0
        const response = await fetch(`${qoyodBaseUrl}/vendors`, {
            headers: {
                'API-KEY': settings.qoyodApiKey
            }
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Qoyod API Error:', errorText)
            return NextResponse.json({ error: `Qoyod API Error: ${response.status} - ${errorText}` }, { status: response.status })
        }

        const data = await response.json()
        const qoyodVendors = data.vendors || []

        let syncedCount = 0

        // Upsert vendors to local DB
        for (const v of qoyodVendors) {
            // Check if vendor exists by qoyodId
            const existing = await prisma.vendor.findFirst({
                where: {
                    ownerId,
                    qoyodVendorId: v.id.toString()
                }
            })

            const vendorData = {
                nameAr: v.name,
                nameEn: v.organization || v.name, // Use organization or fallback to name
                phone: v.phone_number,
                email: v.email,
                qoyodVendorId: v.id.toString(),
                ownerId
            }

            if (existing) {
                await prisma.vendor.update({
                    where: { id: existing.id },
                    data: vendorData
                })
            } else {
                await prisma.vendor.create({
                    data: vendorData
                })
            }
            syncedCount++
        }

        return NextResponse.json({
            message: 'Vendors synced successfully',
            count: syncedCount
        })

    } catch (error) {
        console.error('Error syncing vendors:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
