import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET settings for current owner
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const ownerId = session.user.ownerId

        let settings = await prisma.settings.findUnique({
            where: { ownerId }
        })

        // Create default settings if not exists
        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    ownerId,
                    companyNameAr: 'نظام إدارة القاعات',
                    vatPercentage: 15,
                    qoyodEnabled: false
                }
            })
        }

        return NextResponse.json({
            companyNameAr: settings.companyNameAr,
            companyLogo: settings.companyLogo,
            companyPhone: settings.companyPhone,
            companyEmail: settings.companyEmail,
            companyAddress: settings.companyAddress,
            companyAddressLine2: settings.companyAddressLine2,
            commercialRegNo: settings.commercialRegNo,
            vatRegNo: settings.vatRegNo,
            vatPercentage: Number(settings.vatPercentage),
            qoyodEnabled: settings.qoyodEnabled,
            qoyodApiKey: settings.qoyodApiKey ? '********' : null, // Don't expose full key
            qoyodDefaultBankAccountId: settings.qoyodDefaultBankAccountId,
            qoyodDefaultSalesAccountId: settings.qoyodDefaultSalesAccountId,
            qoyodAutoSync: settings.qoyodAutoSync ?? true,
            slug: settings.slug,
            ogTitle: settings.ogTitle,
            ogDescription: settings.ogDescription,
            ogImage: settings.ogImage
        })
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        )
    }
}

import { enforceSubscription } from '@/lib/subscription'

// PUT - Update settings for current owner
export async function PUT(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Check Subscription
        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        // Only HALL_OWNER and SUPER_ADMIN can update settings
        if (session.user.role !== 'HALL_OWNER' && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 })
        }

        const ownerId = session.user.ownerId
        const body = await request.json()

        const updateData: Record<string, unknown> = {}

        if (body.companyNameAr !== undefined) updateData.companyNameAr = body.companyNameAr
        if (body.companyLogo !== undefined) updateData.companyLogo = body.companyLogo
        if (body.companyPhone !== undefined) updateData.companyPhone = body.companyPhone
        if (body.companyEmail !== undefined) updateData.companyEmail = body.companyEmail
        if (body.companyAddress !== undefined) updateData.companyAddress = body.companyAddress
        if (body.companyAddressLine2 !== undefined) updateData.companyAddressLine2 = body.companyAddressLine2
        if (body.commercialRegNo !== undefined) updateData.commercialRegNo = body.commercialRegNo
        if (body.vatRegNo !== undefined) updateData.vatRegNo = body.vatRegNo
        if (body.vatPercentage !== undefined) updateData.vatPercentage = body.vatPercentage
        if (body.qoyodEnabled !== undefined) updateData.qoyodEnabled = body.qoyodEnabled
        if (body.qoyodApiKey !== undefined && body.qoyodApiKey !== '********') {
            updateData.qoyodApiKey = body.qoyodApiKey
        }
        if (body.qoyodDefaultBankAccountId !== undefined) updateData.qoyodDefaultBankAccountId = body.qoyodDefaultBankAccountId
        if (body.qoyodDefaultSalesAccountId !== undefined) updateData.qoyodDefaultSalesAccountId = body.qoyodDefaultSalesAccountId
        if (body.qoyodAutoSync !== undefined) updateData.qoyodAutoSync = body.qoyodAutoSync

        if (body.slug !== undefined) {
            if (body.slug) {
                const existingSlug = await prisma.settings.findFirst({
                    where: { slug: body.slug, ownerId: { not: ownerId } }
                })
                if (existingSlug) {
                    return NextResponse.json({ error: 'هذا الرابط مستخدم بالفعل، الرجاء اختيار رابط آخر' }, { status: 400 })
                }
            }
            updateData.slug = body.slug || null
        }
        if (body.ogTitle !== undefined) updateData.ogTitle = body.ogTitle || null
        if (body.ogDescription !== undefined) updateData.ogDescription = body.ogDescription || null
        if (body.ogImage !== undefined) updateData.ogImage = body.ogImage || null

        await prisma.settings.upsert({
            where: { ownerId },
            update: updateData,
            create: {
                ownerId,
                ...updateData
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Settings updated successfully'
        })
    } catch (error) {
        console.error('Error updating settings:', error)
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        )
    }
}
