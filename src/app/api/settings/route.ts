import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET settings
export async function GET() {
    try {
        let settings = await prisma.settings.findUnique({
            where: { id: 'system' }
        })

        // Create default settings if not exists
        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    id: 'system',
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
            commercialRegNo: settings.commercialRegNo,
            vatRegNo: settings.vatRegNo,
            vatPercentage: Number(settings.vatPercentage),
            qoyodEnabled: settings.qoyodEnabled,
            qoyodApiKey: settings.qoyodApiKey ? '********' : null // Don't expose full key
        })
    } catch (error) {
        console.error('Error fetching settings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        )
    }
}

// PUT - Update settings
export async function PUT(request: Request) {
    try {
        const body = await request.json()

        const updateData: Record<string, unknown> = {}

        if (body.companyNameAr !== undefined) updateData.companyNameAr = body.companyNameAr
        if (body.companyLogo !== undefined) updateData.companyLogo = body.companyLogo
        if (body.companyPhone !== undefined) updateData.companyPhone = body.companyPhone
        if (body.companyEmail !== undefined) updateData.companyEmail = body.companyEmail
        if (body.companyAddress !== undefined) updateData.companyAddress = body.companyAddress
        if (body.commercialRegNo !== undefined) updateData.commercialRegNo = body.commercialRegNo
        if (body.vatRegNo !== undefined) updateData.vatRegNo = body.vatRegNo
        if (body.vatPercentage !== undefined) updateData.vatPercentage = body.vatPercentage
        if (body.qoyodEnabled !== undefined) updateData.qoyodEnabled = body.qoyodEnabled
        if (body.qoyodApiKey !== undefined && body.qoyodApiKey !== '********') {
            updateData.qoyodApiKey = body.qoyodApiKey
        }

        const settings = await prisma.settings.upsert({
            where: { id: 'system' },
            update: updateData,
            create: {
                id: 'system',
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
