import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const halls = await prisma.hall.findMany({
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' }
        })

        console.log(`🏛️ [API/halls] GET: Returning ${halls.length} halls`)

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
                coffeeServerPrice: hall.coffeeServerPrice ? Number(hall.coffeeServerPrice) : 100,
                sacrificePrice: hall.sacrificePrice ? Number(hall.sacrificePrice) : 1500,
                waterCartonPrice: hall.waterCartonPrice ? Number(hall.waterCartonPrice) : 50,
                extraSectionPrice: hall.extraSectionPrice ? Number(hall.extraSectionPrice) : 0,
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
                defaultCoffeeServers: body.defaultCoffeeServers ? parseInt(body.defaultCoffeeServers) : 0,
                defaultSacrifices: body.defaultSacrifices ? parseInt(body.defaultSacrifices) : 0,
                defaultWaterCartons: body.defaultWaterCartons ? parseInt(body.defaultWaterCartons) : 0,
                coffeeServerPrice: body.coffeeServerPrice ? parseFloat(body.coffeeServerPrice) : 100,
                sacrificePrice: body.sacrificePrice ? parseFloat(body.sacrificePrice) : 1500,
                waterCartonPrice: body.waterCartonPrice ? parseFloat(body.waterCartonPrice) : 50,
                extraSectionPrice: body.extraSectionPrice ? parseFloat(body.extraSectionPrice) : 0,
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
        const body = await request.json()
        const { id, ...updateData } = body

        if (!id) {
            return NextResponse.json({ error: 'Hall ID required' }, { status: 400 })
        }

        const hall = await prisma.hall.update({
            where: { id },
            data: {
                nameAr: updateData.nameAr,
                capacity: updateData.capacity ? parseInt(updateData.capacity) : undefined,
                basePrice: updateData.basePrice ? parseFloat(updateData.basePrice) : undefined,
                hourlyRate: updateData.hourlyRate !== undefined ? (updateData.hourlyRate ? parseFloat(updateData.hourlyRate) : null) : undefined,
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
