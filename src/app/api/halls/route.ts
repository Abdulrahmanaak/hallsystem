import { NextResponse } from 'next/server'
import { hallsService, isDbAvailable } from '@/lib/services/dataService'

export async function GET() {
    try {
        const halls = await hallsService.getAll()

        // If no halls exist in either DB or localStorage, seed defaults
        if (halls.length === 0) {
            console.log('🌱 [API/halls] No halls found, using default halls')
        } else {
            console.log(`🏛️ [API/halls] GET: Returning ${halls.length} halls`)
        }

        // Format halls for frontend compatibility
        const formattedHalls = halls.map(hall => ({
            id: hall.id,
            name: hall.name,
            capacity: hall.capacity,
            price: hall.basePrice,
            basePrice: hall.basePrice,
            hourlyRate: hall.hourlyRate,
            amenities: hall.amenities,
            location: hall.location,
            description: hall.description,
            status: hall.status,
            bookingsCount: hall.bookingsCount,
            createdAt: hall.createdAt,
            // Service Defaults
            defaultCoffeeServers: hall.defaultCoffeeServers,
            defaultSacrifices: hall.defaultSacrifices,
            defaultWaterCartons: hall.defaultWaterCartons,
            coffeeServerPrice: hall.coffeeServerPrice,
            sacrificePrice: hall.sacrificePrice,
            waterCartonPrice: hall.waterCartonPrice,
            extraSectionPrice: hall.extraSectionPrice,
            // Booking Defaults
            defaultGuestCount: hall.defaultGuestCount,
            defaultSectionType: hall.defaultSectionType,
            // Meal Prices
            mealPrices: hall.mealPrices
        }))

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

        const hall = await hallsService.create({
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
            defaultGuestCount: body.defaultGuestCount ? parseInt(body.defaultGuestCount) : undefined,
            defaultSectionType: body.defaultSectionType || 'both',
            mealPrices: body.mealPrices || undefined
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

        const hall = await hallsService.update(id, {
            nameAr: updateData.nameAr,
            capacity: updateData.capacity ? parseInt(updateData.capacity) : undefined,
            basePrice: updateData.basePrice ? parseFloat(updateData.basePrice) : undefined,
            hourlyRate: updateData.hourlyRate ? parseFloat(updateData.hourlyRate) : null,
            amenities: updateData.amenities || null,
            location: updateData.location || null,
            description: updateData.description || null,
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
            mealPrices: updateData.mealPrices || undefined
        })

        if (!hall) {
            return NextResponse.json({ error: 'Hall not found' }, { status: 404 })
        }

        return NextResponse.json(hall)
    } catch (error) {
        console.error('Error updating hall:', error)
        return NextResponse.json(
            { error: 'Failed to update hall' },
            { status: 500 }
        )
    }
}
