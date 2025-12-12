import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const bookings = await prisma.booking.findMany({
            where: {
                isDeleted: false
            },
            include: {
                hall: {
                    select: {
                        id: true,
                        nameAr: true
                    }
                },
                customer: {
                    select: {
                        id: true,
                        nameAr: true,
                        phone: true,
                        email: true
                    }
                }
            },
            orderBy: {
                eventDate: 'desc'
            }
        })

        // Format bookings for display
        const formattedBookings = bookings.map(booking => ({
            id: booking.id,
            bookingNumber: booking.bookingNumber,
            customerId: booking.customerId,
            customerName: booking.customer.nameAr,
            customerPhone: booking.customer.phone,
            customerEmail: booking.customer.email,
            hallId: booking.hallId,
            hallName: booking.hall.nameAr,
            eventType: booking.eventType,
            eventDate: booking.eventDate.toISOString(),
            date: booking.eventDate.toISOString().split('T')[0],
            startTime: booking.startTime.toISOString().split('T')[1].substring(0, 5),
            endTime: booking.endTime.toISOString().split('T')[1].substring(0, 5),
            guestCount: booking.guestCount,
            status: booking.status,
            totalAmount: Number(booking.totalAmount),
            discountAmount: Number(booking.discountAmount),
            vatAmount: Number(booking.vatAmount),
            finalAmount: Number(booking.finalAmount),
            notes: booking.notes,
            createdAt: booking.createdAt.toISOString()
        }))

        return NextResponse.json(formattedBookings)
    } catch (error) {
        console.error('Error fetching bookings:', error)
        return NextResponse.json(
            { error: 'Failed to fetch bookings' },
            { status: 500 }
        )
    }
}

// Generate booking number: BK-2025-0001
async function generateBookingNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `BK-${year}-`

    const lastBooking = await prisma.booking.findFirst({
        where: {
            bookingNumber: {
                startsWith: prefix
            }
        },
        orderBy: {
            bookingNumber: 'desc'
        }
    })

    let nextNumber = 1
    if (lastBooking) {
        const lastNumber = parseInt(lastBooking.bookingNumber.split('-')[2])
        nextNumber = lastNumber + 1
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// POST - Create new booking
export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Get admin user for createdById
        const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN', status: 'ACTIVE' },
            select: { id: true }
        })

        if (!adminUser) {
            return NextResponse.json(
                { error: 'No valid user found' },
                { status: 400 }
            )
        }

        const bookingNumber = await generateBookingNumber()

        // Calculate amounts
        const totalAmount = parseFloat(body.totalAmount) || 0
        const discountAmount = parseFloat(body.discountAmount) || 0
        const vatRate = 0.15 // 15% VAT
        const amountAfterDiscount = totalAmount - discountAmount
        const vatAmount = amountAfterDiscount * vatRate
        const finalAmount = amountAfterDiscount + vatAmount

        // Parse date and times
        const eventDate = new Date(body.eventDate)
        const [startHour, startMin] = body.startTime.split(':').map(Number)
        const [endHour, endMin] = body.endTime.split(':').map(Number)

        const startTime = new Date(eventDate)
        startTime.setHours(startHour, startMin, 0, 0)

        const endTime = new Date(eventDate)
        endTime.setHours(endHour, endMin, 0, 0)

        const booking = await prisma.booking.create({
            data: {
                bookingNumber,
                customerId: body.customerId,
                hallId: body.hallId,
                eventType: body.eventType,
                eventDate,
                startTime,
                endTime,
                guestCount: body.guestCount ? parseInt(body.guestCount) : null,
                totalAmount,
                discountAmount,
                vatAmount,
                finalAmount,
                status: 'PENDING',
                notes: body.notes || null,
                createdById: adminUser.id
            },
            include: {
                customer: { select: { nameAr: true } },
                hall: { select: { nameAr: true } }
            }
        })

        return NextResponse.json(booking, { status: 201 })
    } catch (error) {
        console.error('Error creating booking:', error)
        return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
        )
    }
}

