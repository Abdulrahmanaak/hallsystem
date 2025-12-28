import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        let halls = await prisma.hall.findMany({
            where: { isDeleted: false },
            include: { _count: { select: { bookings: true } } },
            orderBy: { nameAr: 'asc' }
        })

        if (halls.length === 0) {
            console.log('🌱 Database empty, seeding default halls...')
            const defaultHalls = [
                { nameAr: 'القاعة الكبرى', capacity: 500, basePrice: 5000, amenities: JSON.stringify({ lighting: true, sound: true }) },
                { nameAr: 'قاعة الحديقة', capacity: 300, basePrice: 3500, amenities: JSON.stringify({ outdoor: true }) },
                { nameAr: 'الجناح الملكي', capacity: 100, basePrice: 1500, amenities: JSON.stringify({ vip: true }) },
            ]

            // Create sequentially to avoid race conditions in SQLite simple setup
            for (const h of defaultHalls) {
                await prisma.hall.create({ data: h })
            }

            // Re-fetch
            halls = await prisma.hall.findMany({
                where: { isDeleted: false },
                include: { _count: { select: { bookings: true } } },
                orderBy: { nameAr: 'asc' }
            })
        }

        const formattedHalls = halls.map(hall => ({
            id: hall.id,
            name: hall.nameAr,
            capacity: hall.capacity,
            price: Number(hall.basePrice), // Normalized to 'price' for frontend compatibility
            basePrice: Number(hall.basePrice),
            hourlyRate: hall.hourlyRate ? Number(hall.hourlyRate) : null,
            amenities: hall.amenities,
            location: hall.location,
            description: hall.description,
            status: hall.status,
            bookingsCount: hall._count.bookings,
            createdAt: hall.createdAt.toISOString(),
            // Service Defaults
            defaultCoffeeServers: hall.defaultCoffeeServers || 0,
            defaultSacrifices: hall.defaultSacrifices || 0,
            defaultWaterCartons: hall.defaultWaterCartons || 0,
            coffeeServerPrice: hall.coffeeServerPrice ? Number(hall.coffeeServerPrice) : 100,
            sacrificePrice: hall.sacrificePrice ? Number(hall.sacrificePrice) : 1500,
            waterCartonPrice: hall.waterCartonPrice ? Number(hall.waterCartonPrice) : 50,
            extraSectionPrice: hall.extraSectionPrice ? Number(hall.extraSectionPrice) : 0,
            // Booking Defaults
            defaultGuestCount: hall.defaultGuestCount || hall.capacity,
            defaultSectionType: hall.defaultSectionType || 'both',
            // Meal Prices
            mealPrices: hall.mealPrices ? JSON.parse(hall.mealPrices) : { dinner: 150, lunch: 100, breakfast: 50, snacks: 30 }
        }))

        return NextResponse.json(formattedHalls)
    } catch (error) {
        console.error('Error fetching halls:', error)
        return NextResponse.json({ error: 'Failed to fetch halls' }, { status: 500 });
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
                // Service Defaults
                defaultCoffeeServers: body.defaultCoffeeServers ? parseInt(body.defaultCoffeeServers) : 0,
                defaultSacrifices: body.defaultSacrifices ? parseInt(body.defaultSacrifices) : 0,
                defaultWaterCartons: body.defaultWaterCartons ? parseInt(body.defaultWaterCartons) : 0,
                coffeeServerPrice: body.coffeeServerPrice ? parseFloat(body.coffeeServerPrice) : 100,
                sacrificePrice: body.sacrificePrice ? parseFloat(body.sacrificePrice) : 1500,
                waterCartonPrice: body.waterCartonPrice ? parseFloat(body.waterCartonPrice) : 50,
                extraSectionPrice: body.extraSectionPrice ? parseFloat(body.extraSectionPrice) : 0,
                // Booking Defaults
                defaultGuestCount: body.defaultGuestCount ? parseInt(body.defaultGuestCount) : null,
                defaultSectionType: body.defaultSectionType || 'both',
                // Meal Prices
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
                hourlyRate: updateData.hourlyRate ? parseFloat(updateData.hourlyRate) : null,
                amenities: updateData.amenities || null,
                location: updateData.location || null,
                description: updateData.description || null,
                status: updateData.status || undefined,
                // Service Defaults
                defaultCoffeeServers: updateData.defaultCoffeeServers !== undefined ? parseInt(updateData.defaultCoffeeServers) : undefined,
                defaultSacrifices: updateData.defaultSacrifices !== undefined ? parseInt(updateData.defaultSacrifices) : undefined,
                defaultWaterCartons: updateData.defaultWaterCartons !== undefined ? parseInt(updateData.defaultWaterCartons) : undefined,
                coffeeServerPrice: updateData.coffeeServerPrice !== undefined ? parseFloat(updateData.coffeeServerPrice) : undefined,
                sacrificePrice: updateData.sacrificePrice !== undefined ? parseFloat(updateData.sacrificePrice) : undefined,
                waterCartonPrice: updateData.waterCartonPrice !== undefined ? parseFloat(updateData.waterCartonPrice) : undefined,
                extraSectionPrice: updateData.extraSectionPrice !== undefined ? parseFloat(updateData.extraSectionPrice) : undefined,
                // Booking Defaults
                defaultGuestCount: updateData.defaultGuestCount !== undefined ? parseInt(updateData.defaultGuestCount) : undefined,
                defaultSectionType: updateData.defaultSectionType || undefined,
                // Meal Prices
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
