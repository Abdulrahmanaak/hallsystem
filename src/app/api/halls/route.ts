import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { enforceSubscription } from '@/lib/subscription'

// Helper to get owner filter based on user role
async function getOwnerFilter() {
    const session = await auth()
    if (!session?.user) {
        return { error: 'غير مصرح', status: 401 }
    }

    // SUPER_ADMIN sees all data
    if (session.user.role === 'SUPER_ADMIN') {
        return { filter: {} }
    }

    // All other users see only their owner's data
    return { filter: { ownerId: session.user.ownerId } }
}

export async function GET() {
    try {
        const ownerResult = await getOwnerFilter()
        if ('error' in ownerResult) {
            return NextResponse.json({ error: ownerResult.error }, { status: ownerResult.status })
        }

        const halls = await prisma.hall.findMany({
            where: {
                isDeleted: false,
                ...ownerResult.filter
            },
            orderBy: { createdAt: 'desc' }
        })


        // Format halls for frontend compatibility
        const formattedHalls = halls.map(hall => {
            // Parse mealPrices from JSON string
            let mealPrices = null
            if (hall.mealPrices) {
                try {
                    mealPrices = JSON.parse(hall.mealPrices)
                } catch { mealPrices = null }
            }

            return {
                id: hall.id,
                name: hall.nameAr,
                nameAr: hall.nameAr,
                capacity: hall.capacity,
                price: Number(hall.basePrice),
                basePrice: Number(hall.basePrice),
                hourlyRate: hall.hourlyRate ? Number(hall.hourlyRate) : null,
                amenities: hall.amenities,
                location: hall.location,
                description: hall.description,
                status: hall.status,
                createdAt: hall.createdAt,
                // Service Defaults
                defaultCoffeeServers: hall.defaultCoffeeServers,
                defaultSacrifices: hall.defaultSacrifices,
                defaultWaterCartons: hall.defaultWaterCartons,
                coffeeServerPrice: hall.coffeeServerPrice !== null ? Number(hall.coffeeServerPrice) : 100,
                sacrificePrice: hall.sacrificePrice !== null ? Number(hall.sacrificePrice) : 1500,
                waterCartonPrice: hall.waterCartonPrice !== null ? Number(hall.waterCartonPrice) : 50,
                extraSectionPrice: hall.extraSectionPrice !== null ? Number(hall.extraSectionPrice) : 0,
                // Booking Defaults
                defaultGuestCount: hall.defaultGuestCount,
                defaultSectionType: hall.defaultSectionType,
                // Meal Prices
                mealPrices
            }
        })

        return NextResponse.json(formattedHalls)
    } catch (error) {
        console.error('Error fetching halls:', error)
        return NextResponse.json({ error: 'Failed to fetch halls' }, { status: 500 })
    }
}

// POST - Create new hall
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Check Subscription
        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        // Only HALL_OWNER and SUPER_ADMIN can create halls
        if (session.user.role !== 'HALL_OWNER' && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'ليس لديك صلاحية لإضافة قاعات' }, { status: 403 })
        }

        const body = await request.json()

        const hall = await prisma.hall.create({
            data: {
                nameAr: body.nameAr,
                capacity: parseInt(body.capacity),
                basePrice: parseFloat(body.basePrice),
                hourlyRate: body.hourlyRate ? parseFloat(body.hourlyRate) : null,
                amenities: body.amenities || null,
                location: body.location || null,
                description: body.description || null,
                status: body.status || 'ACTIVE',
                ownerId: session.user.ownerId, // Tenant isolation
                defaultCoffeeServers: body.defaultCoffeeServers ? parseInt(body.defaultCoffeeServers) : 0,
                defaultSacrifices: body.defaultSacrifices ? parseInt(body.defaultSacrifices) : 0,
                defaultWaterCartons: body.defaultWaterCartons ? parseInt(body.defaultWaterCartons) : 0,
                coffeeServerPrice: body.coffeeServerPrice !== undefined ? parseFloat(body.coffeeServerPrice) : 100,
                sacrificePrice: body.sacrificePrice !== undefined ? parseFloat(body.sacrificePrice) : 1500,
                waterCartonPrice: body.waterCartonPrice !== undefined ? parseFloat(body.waterCartonPrice) : 50,
                extraSectionPrice: body.extraSectionPrice !== undefined ? parseFloat(body.extraSectionPrice) : 0,
                defaultGuestCount: body.defaultGuestCount ? parseInt(body.defaultGuestCount) : null,
                defaultSectionType: body.defaultSectionType || 'both',
                mealPrices: body.mealPrices ? JSON.stringify(body.mealPrices) : null
            }
        })

        return NextResponse.json(hall, { status: 201 })
    } catch (error) {
        console.error('Error creating hall:', error)
        return NextResponse.json(
            { error: 'Failed to create hall' },
            { status: 500 }
        )
    }
}

// PUT - Update existing hall
export async function PUT(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Check Subscription
        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const body = await request.json()
        const { id, ...updateData } = body

        if (!id) {
            return NextResponse.json({ error: 'Hall ID required' }, { status: 400 })
        }

        // Verify ownership (unless SUPER_ADMIN)
        if (session.user.role !== 'SUPER_ADMIN') {
            const existingHall = await prisma.hall.findFirst({
                where: { id, ownerId: session.user.ownerId }
            })
            if (!existingHall) {
                return NextResponse.json({ error: 'القاعة غير موجودة أو ليس لديك صلاحية' }, { status: 404 })
            }
        }

        const hall = await prisma.hall.update({
            where: { id },
            data: {
                nameAr: updateData.nameAr,
                capacity: updateData.capacity !== undefined ? parseInt(updateData.capacity) : undefined,
                basePrice: updateData.basePrice !== undefined ? parseFloat(updateData.basePrice) : undefined,
                hourlyRate: updateData.hourlyRate !== undefined ? (updateData.hourlyRate !== null && updateData.hourlyRate !== '' ? parseFloat(updateData.hourlyRate) : null) : undefined,
                amenities: updateData.amenities !== undefined ? updateData.amenities : undefined,
                location: updateData.location !== undefined ? updateData.location : undefined,
                description: updateData.description !== undefined ? updateData.description : undefined,
                status: updateData.status || undefined,
                defaultCoffeeServers: updateData.defaultCoffeeServers !== undefined ? parseInt(updateData.defaultCoffeeServers) : undefined,
                defaultSacrifices: updateData.defaultSacrifices !== undefined ? parseInt(updateData.defaultSacrifices) : undefined,
                defaultWaterCartons: updateData.defaultWaterCartons !== undefined ? parseInt(updateData.defaultWaterCartons) : undefined,
                coffeeServerPrice: updateData.coffeeServerPrice !== undefined ? parseFloat(updateData.coffeeServerPrice) : undefined,
                sacrificePrice: updateData.sacrificePrice !== undefined ? parseFloat(updateData.sacrificePrice) : undefined,
                waterCartonPrice: updateData.waterCartonPrice !== undefined ? parseFloat(updateData.waterCartonPrice) : undefined,
                extraSectionPrice: updateData.extraSectionPrice !== undefined ? parseFloat(updateData.extraSectionPrice) : undefined,
                defaultGuestCount: updateData.defaultGuestCount !== undefined ? parseInt(updateData.defaultGuestCount) : undefined,
                defaultSectionType: updateData.defaultSectionType || undefined,
                mealPrices: updateData.mealPrices ? JSON.stringify(updateData.mealPrices) : undefined
            }
        })

        return NextResponse.json(hall)
    } catch (error) {
        console.error('Error updating hall:', error)
        return NextResponse.json(
            { error: 'Failed to update hall' },
            { status: 500 }
        )
    }
}
