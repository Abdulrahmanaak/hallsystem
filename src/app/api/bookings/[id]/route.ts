import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isDbAvailable, bookingsService } from '@/lib/services/dataService'
import { bookingsAdapter } from '@/lib/services/localStorageAdapter'

// GET single booking
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const dbAvailable = await isDbAvailable()

        if (dbAvailable) {
            try {
                const booking = await prisma.booking.findUnique({
                    where: { id },
                    include: {
                        customer: true,
                        hall: true,
                        invoices: true,
                        payments: true,
                        statusHistory: {
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                })

                if (!booking || booking.isDeleted) {
                    return NextResponse.json(
                        { error: 'Booking not found' },
                        { status: 404 }
                    )
                }

                return NextResponse.json(booking)
            } catch (error) {
                console.error('Error fetching booking from DB:', error)
            }
        }

        // Fallback to localStorage
        const booking = bookingsAdapter.getById(id)
        if (!booking) {
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(booking)
    } catch (error) {
        console.error('Error fetching booking:', error)
        return NextResponse.json(
            { error: 'Failed to fetch booking' },
            { status: 500 }
        )
    }
}

// PUT - Update booking
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const dbAvailable = await isDbAvailable()

        // Parse date and times if provided
        let updateData: Record<string, unknown> = {}

        if (body.eventDate) {
            updateData.eventDate = new Date(body.eventDate)
        }

        if (body.startTime && body.eventDate) {
            const eventDate = new Date(body.eventDate)
            const [startHour, startMin] = body.startTime.split(':').map(Number)
            const startTime = new Date(eventDate)
            startTime.setHours(startHour, startMin, 0, 0)
            updateData.startTime = startTime
        }

        if (body.endTime && body.eventDate) {
            const eventDate = new Date(body.eventDate)
            const [endHour, endMin] = body.endTime.split(':').map(Number)
            const endTime = new Date(eventDate)
            endTime.setHours(endHour, endMin, 0, 0)
            updateData.endTime = endTime
        }

        if (body.customerId) updateData.customerId = body.customerId
        if (body.hallId) updateData.hallId = body.hallId
        if (body.eventType) updateData.eventType = body.eventType
        if (body.guestCount !== undefined) updateData.guestCount = body.guestCount ? parseInt(body.guestCount) : null
        if (body.notes !== undefined) updateData.notes = body.notes || null

        // New Fields
        if (body.sectionType !== undefined) updateData.sectionType = body.sectionType
        if (body.mealType !== undefined) updateData.mealType = body.mealType
        if (body.services !== undefined) updateData.services = body.services ? JSON.stringify(body.services) : null
        if (body.coffeeServers !== undefined) updateData.coffeeServers = body.coffeeServers ? parseInt(body.coffeeServers) : null
        if (body.sacrifices !== undefined) updateData.sacrifices = body.sacrifices ? parseInt(body.sacrifices) : null
        if (body.downPayment !== undefined) updateData.downPayment = parseFloat(body.downPayment) || 0

        // Recalculate amounts if totalAmount or discountAmount changed
        if (body.totalAmount !== undefined || body.discountAmount !== undefined) {
            const totalAmount = parseFloat(body.totalAmount) || 0
            const discountAmount = parseFloat(body.discountAmount) || 0
            const vatRate = 0.15
            const amountAfterDiscount = totalAmount - discountAmount
            const vatAmount = amountAfterDiscount * vatRate
            const finalAmount = amountAfterDiscount + vatAmount

            updateData.totalAmount = totalAmount
            updateData.discountAmount = discountAmount
            updateData.vatAmount = vatAmount
            updateData.finalAmount = finalAmount
        }

        if (dbAvailable) {
            try {
                const booking = await prisma.booking.update({
                    where: { id },
                    data: updateData,
                    include: {
                        customer: { select: { nameAr: true } },
                        hall: { select: { nameAr: true } }
                    }
                })

                return NextResponse.json(booking)
            } catch (error) {
                console.error('Error updating booking in DB:', error)
            }
        }

        // Fallback to localStorage
        const localUpdateData: Record<string, unknown> = { ...updateData }
        if (updateData.eventDate) {
            localUpdateData.eventDate = (updateData.eventDate as Date).toISOString()
            localUpdateData.date = (updateData.eventDate as Date).toISOString().split('T')[0]
        }
        if (updateData.startTime) {
            localUpdateData.startTime = body.startTime
        }
        if (updateData.endTime) {
            localUpdateData.endTime = body.endTime
        }

        const booking = bookingsAdapter.update(id, localUpdateData as Partial<typeof booking>)
        if (!booking) {
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(booking)
    } catch (error) {
        console.error('Error updating booking:', error)
        return NextResponse.json(
            { error: 'Failed to update booking' },
            { status: 500 }
        )
    }
}

// DELETE - Soft delete booking (cancel)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const dbAvailable = await isDbAvailable()

        if (dbAvailable) {
            try {
                await prisma.booking.update({
                    where: { id },
                    data: {
                        isDeleted: true,
                        deletedAt: new Date(),
                        status: 'CANCELLED'
                    }
                })

                return NextResponse.json({ success: true })
            } catch (error) {
                console.error('Error deleting booking from DB:', error)
            }
        }

        // Fallback to localStorage
        const success = bookingsAdapter.delete(id)
        if (!success) {
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting booking:', error)
        return NextResponse.json(
            { error: 'Failed to delete booking' },
            { status: 500 }
        )
    }
}

// PATCH - Update booking status
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        if (!body.status) {
            return NextResponse.json(
                { error: 'Status is required' },
                { status: 400 }
            )
        }

        const dbAvailable = await isDbAvailable()

        if (dbAvailable) {
            try {
                // Get admin user
                const adminUser = await prisma.user.findFirst({
                    where: { role: 'ADMIN', status: 'ACTIVE' },
                    select: { id: true }
                })

                // Update booking status and create history record
                const booking = await prisma.booking.update({
                    where: { id },
                    data: {
                        status: body.status,
                        statusHistory: {
                            create: {
                                fromStatus: body.fromStatus || 'PENDING',
                                toStatus: body.status,
                                createdById: adminUser?.id || null,
                                notes: body.notes || null
                            }
                        }
                    }
                })

                return NextResponse.json(booking)
            } catch (error) {
                console.error('Error updating booking status in DB:', error)
            }
        }

        // Fallback to localStorage
        const booking = bookingsAdapter.updateStatus(id, body.status)
        if (!booking) {
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(booking)
    } catch (error) {
        console.error('Error updating booking status:', error)
        return NextResponse.json(
            { error: 'Failed to update booking status' },
            { status: 500 }
        )
    }
}
