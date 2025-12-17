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
            createdAt: hall.createdAt.toISOString()
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
                capacity: body.capacity,
                basePrice: body.basePrice,
                hourlyRate: body.hourlyRate || null,
                amenities: body.amenities || null,
                location: body.location || null,
                description: body.description || null,
                status: body.status || 'ACTIVE'
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

