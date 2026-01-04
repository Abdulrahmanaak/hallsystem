import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Helper to get owner filter based on user role
async function getOwnerFilter() {
    const session = await auth()
    if (!session?.user) {
        return { error: 'غير مصرح', status: 401 }
    }

    // SUPER_ADMIN sees all data
    if (session.user.role === 'SUPER_ADMIN') {
        return { filter: {}, session }
    }

    return { filter: { ownerId: session.user.ownerId }, session }
}

// GET - Fetch all bookings
export async function GET() {
    try {
        const ownerResult = await getOwnerFilter()
        if ('error' in ownerResult) {
            return NextResponse.json({ error: ownerResult.error }, { status: ownerResult.status })
        }

        const bookings = await prisma.booking.findMany({
            where: {
                isDeleted: false,
                ...ownerResult.filter
            },
            include: {
                customer: { select: { id: true, nameAr: true, phone: true, idNumber: true } },
                hall: { select: { id: true, nameAr: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Format for frontend
        const formattedBookings = bookings.map(b => ({
            id: b.id,
            bookingNumber: b.bookingNumber,
            customerId: b.customerId,
            customerName: b.customer.nameAr,
            customerPhone: b.customer.phone,
            customerIdNumber: b.customer.idNumber,
            hallId: b.hallId,
            hallName: b.hall.nameAr,
            eventType: b.eventType,
            eventDate: b.eventDate,
            date: b.eventDate.toISOString().split('T')[0],
            startTime: b.startTime.toTimeString().slice(0, 5),
            endTime: b.endTime.toTimeString().slice(0, 5),
            guestCount: b.guestCount,
            sectionType: b.sectionType,
            mealType: b.mealType,
            services: b.services ? JSON.parse(b.services) : null,
            coffeeServers: b.coffeeServers,
            sacrifices: b.sacrifices,
            waterCartons: b.waterCartons,
            totalAmount: Number(b.totalAmount),
            downPayment: Number(b.downPayment),
            discountAmount: Number(b.discountAmount),
            vatAmount: Number(b.vatAmount),
            finalAmount: Number(b.finalAmount),
            serviceRevenue: Number(b.serviceRevenue),
            servicesBreakdown: b.servicesBreakdown,
            status: b.status,
            notes: b.notes,
            createdAt: b.createdAt
        }))

        console.log(`📝 [API/bookings] GET: Returning ${formattedBookings.length} bookings`)
        return NextResponse.json(formattedBookings)
    } catch (error) {
        console.error('Error fetching bookings:', error)
        return NextResponse.json([], { status: 500 })
    }
}

// Generate booking number: BK-2025-0001
async function generateBookingNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `BK-${year}-`

    const lastBooking = await prisma.booking.findFirst({
        where: {
            bookingNumber: { startsWith: prefix }
        },
        orderBy: { bookingNumber: 'desc' }
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
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const ownerId = session.user.ownerId
        const body = await request.json()

        // Find or Create Customer
        let customerId = body.customerId

        if (!customerId && body.customerName && body.customerPhone) {
            // Check if customer exists by ID Number or Phone within this owner's data
            let existingCustomer = null

            if (body.customerIdNumber) {
                existingCustomer = await prisma.customer.findFirst({
                    where: {
                        idNumber: body.customerIdNumber,
                        isDeleted: false,
                        ownerId: ownerId
                    }
                })
            }

            if (!existingCustomer) {
                existingCustomer = await prisma.customer.findFirst({
                    where: {
                        phone: body.customerPhone,
                        isDeleted: false,
                        ownerId: ownerId
                    }
                })
            }

            if (existingCustomer) {
                customerId = existingCustomer.id
            } else {
                // Create new customer with tenant isolation
                const newCustomer = await prisma.customer.create({
                    data: {
                        nameAr: body.customerName,
                        phone: body.customerPhone,
                        idNumber: body.customerIdNumber || null,
                        email: body.customerEmail || null,
                        ownerId: ownerId,
                        createdById: session.user.id
                    }
                })
                customerId = newCustomer.id
            }
        }

        if (!customerId) {
            return NextResponse.json(
                { error: 'Customer details required' },
                { status: 400 }
            )
        }

        const bookingNumber = await generateBookingNumber()

        // Calculate amounts
        const totalAmount = parseFloat(body.totalAmount) || 0
        const discountAmount = parseFloat(body.discountAmount) || 0
        const downPayment = parseFloat(body.downPayment) || 0
        const vatAmount = parseFloat(body.vatAmount) || 0
        const finalAmount = totalAmount - discountAmount

        // Date logic
        const eventDate = new Date(body.date)
        const [startHours, startMinutes] = (body.startTime || "16:00").split(':').map(Number)
        const startTime = new Date(eventDate)
        startTime.setHours(startHours, startMinutes, 0, 0)

        const [endHours, endMinutes] = (body.endTime || "23:00").split(':').map(Number)
        const endTime = new Date(eventDate)
        endTime.setHours(endHours, endMinutes, 0, 0)

        const booking = await prisma.booking.create({
            data: {
                bookingNumber,
                customerId,
                hallId: body.hallId,
                ownerId: ownerId, // Tenant isolation
                eventType: body.eventType,
                eventDate,
                startTime,
                endTime,
                guestCount: body.guestCount ? parseInt(body.guestCount) : null,
                sectionType: body.sectionType,
                mealType: body.mealType,
                services: body.services ? JSON.stringify(body.services) : null,
                coffeeServers: body.coffeeServers ? parseInt(body.coffeeServers) : null,
                sacrifices: body.sacrifices ? parseInt(body.sacrifices) : null,
                waterCartons: body.waterCartons ? parseInt(body.waterCartons) : null,
                totalAmount,
                downPayment,
                discountAmount,
                vatAmount,
                finalAmount,
                serviceRevenue: parseFloat(body.serviceRevenue) || 0,
                servicesBreakdown: body.servicesBreakdown || null,
                status: body.status || "TENTATIVE",
                notes: body.notes || null,
                createdById: session.user.id
            },
            include: {
                customer: { select: { nameAr: true } },
                hall: { select: { nameAr: true } }
            }
        })

        return NextResponse.json(booking, { status: 201 })
    } catch (error) {
        console.error('Error creating booking:', error)
        return NextResponse.json({ error: 'Database operation failed', details: String(error) }, { status: 500 })
    }
}
