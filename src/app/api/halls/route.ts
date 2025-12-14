import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const halls = await prisma.hall.findMany({
            where: {
                isDeleted: false
            },
            include: {
                _count: {
                    select: {
                        bookings: true
                    }
                }
            },
            orderBy: {
                nameAr: 'asc'
            }
        })

        const formattedHalls = halls.map(hall => ({
            id: hall.id,
            name: hall.nameAr,
            capacity: hall.capacity,
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
        console.log('⚠️ Database unavailable, falling back to MOCK_HALLS');
        const { MOCK_HALLS } = await import('@/lib/mock-data');
        return NextResponse.json(MOCK_HALLS);
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

