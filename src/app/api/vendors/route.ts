import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Determine ownerId
        const ownerId = session.user.role === 'HALL_OWNER' ? session.user.id : session.user.ownerId

        if (!ownerId) {
            return NextResponse.json({ error: 'Configuration Error: No Owner ID found' }, { status: 500 })
        }

        const vendors = await prisma.vendor.findMany({
            where: { ownerId },
            orderBy: { nameAr: 'asc' }
        })

        return NextResponse.json(vendors)
    } catch (error) {
        console.error('Error fetching vendors:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

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
        const body = await req.json()
        const { nameAr, nameEn, phone, email } = body

        if (!nameAr) {
            return NextResponse.json({ error: 'Vendor Name (Arabic) is required' }, { status: 400 })
        }

        const vendor = await prisma.vendor.create({
            data: {
                nameAr,
                nameEn,
                phone,
                email,
                ownerId: ownerId!
            }
        })

        // Sync to Qoyod if enabled
        try {
            const { getQoyodConfig, qoyodRequest } = await import('@/lib/services/qoyod')
            const config = await getQoyodConfig(ownerId)

            if (config) {
                const payload = {
                    contact: {
                        name: nameAr,
                        // Qoyod might require more fields, but name is usually minimum.
                        // Can add phone/email if needed.
                        mobile: phone,
                        email: email
                    }
                }

                const qoyodRes = await qoyodRequest('/contacts', 'POST', payload, config) as { contact?: { id: number | string } }

                if (qoyodRes?.contact?.id) {
                    await prisma.vendor.update({
                        where: { id: vendor.id },
                        data: { qoyodVendorId: qoyodRes.contact.id.toString() }
                    })
                    vendor.qoyodVendorId = qoyodRes.contact.id.toString()
                }
            }
        } catch (error) {
            console.error('Error syncing new vendor to Qoyod:', error)
            // Continue, don't fail the request
        }

        return NextResponse.json(vendor)

    } catch (error) {
        console.error('Error creating vendor:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
