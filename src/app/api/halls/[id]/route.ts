import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single hall
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const hall = await prisma.hall.findUnique({
            where: { id },
            include: {
                bookings: {
                    where: { isDeleted: false },
                    include: {
                        customer: {
                            select: { nameAr: true }
                        }
                    },
                    orderBy: { eventDate: 'desc' },
                    take: 10
                }
            }
        })

        if (!hall || hall.isDeleted) {
            return NextResponse.json(
                { error: 'Hall not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(hall)
    } catch (error) {
        console.error('Error fetching hall:', error)
        return NextResponse.json(
            { error: 'Failed to fetch hall' },
            { status: 500 }
        )
    }
}

// PUT - Update hall
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const hall = await prisma.hall.update({
            where: { id },
            data: {
                nameAr: body.nameAr,
                capacity: body.capacity,
                basePrice: body.basePrice,
                hourlyRate: body.hourlyRate || null,
                amenities: body.amenities || null,
                location: body.location || null,
                description: body.description || null,
                status: body.status
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

// DELETE - Soft delete hall
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.hall.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date()
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting hall:', error)
        return NextResponse.json(
            { error: 'Failed to delete hall' },
            { status: 500 }
        )
    }
}
