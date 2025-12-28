import { NextResponse } from 'next/server'
import { bookingsService, customersService, isDbAvailable } from '@/lib/services/dataService'
import { prisma } from '@/lib/prisma'
import { bookingsAdapter, customersAdapter } from '@/lib/services/localStorageAdapter'

// GET - Fetch all bookings
export async function GET() {
    try {
        const bookings = await bookingsService.getAll()
        console.log(`📝 [API/bookings] GET: Returning ${bookings.length} bookings`)
        return NextResponse.json(bookings)
    } catch (error) {
        console.error('Error fetching bookings:', error)
        return NextResponse.json([], { status: 500 })
    }
}

// Generate booking number: BK-2025-0001
async function generateBookingNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `BK-${year}-`

    // Check if DB is available
    if (await isDbAvailable()) {
        try {
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
        } catch (error) {
            console.error('Error generating booking number from DB:', error)
        }
    }

    // Fallback: generate from localStorage
    const bookings = bookingsAdapter.getAll()
    let maxNumber = 0
    bookings.forEach(b => {
        if (b.bookingNumber.startsWith(prefix)) {
            const num = parseInt(b.bookingNumber.split('-')[2])
            if (num > maxNumber) maxNumber = num
        }
    })

    return `${prefix}${(maxNumber + 1).toString().padStart(4, '0')}`
}

// POST - Create new booking
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const dbAvailable = await isDbAvailable()

        // Find or Create Customer
        let customerId = body.customerId
        let customerName = body.customerName
        let customerPhone = body.customerPhone

        if (!customerId && body.customerName && body.customerPhone) {
            // Check if customer exists by ID Number (Priority) or Phone
            let existingCustomer = null

            if (body.customerIdNumber) {
                existingCustomer = await customersService.findByIdNumber(body.customerIdNumber)
            }

            if (!existingCustomer) {
                existingCustomer = await customersService.findByPhone(body.customerPhone)
            }

            if (existingCustomer) {
                customerId = existingCustomer.id
                customerName = existingCustomer.nameAr
                customerPhone = existingCustomer.phone
            } else {
                // Create new customer
                const newCustomer = await customersService.create({
                    nameAr: body.customerName,
                    phone: body.customerPhone,
                    idNumber: body.customerIdNumber,
                    email: body.customerEmail
                })
                customerId = newCustomer.id
            }
        }

        if (!customerId && !customerName) {
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

        if (dbAvailable) {
            try {
                // Get admin user
                const adminUser = await prisma.user.findFirst({
                    where: { role: 'ADMIN', status: 'ACTIVE' },
                    select: { id: true }
                }) || { id: await ensureSystemUser() }

                const booking = await prisma.booking.create({
                    data: {
                        bookingNumber,
                        customerId,
                        hallId: body.hallId,
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
                        createdById: adminUser.id
                    },
                    include: {
                        customer: { select: { nameAr: true } },
                        hall: { select: { nameAr: true } }
                    }
                })

                return NextResponse.json(booking, { status: 201 })
            } catch (error) {
                console.error('Error creating booking in DB, falling back to localStorage:', error)
            }
        }

        // Fallback to localStorage
        const newBooking = bookingsAdapter.create({
            bookingNumber,
            customerId: customerId || '',
            customerName: customerName || body.customerName,
            customerPhone: customerPhone || body.customerPhone,
            customerEmail: body.customerEmail,
            customerIdNumber: body.customerIdNumber,
            hallId: body.hallId,
            hallName: body.hallName || '',
            eventType: body.eventType,
            eventDate: eventDate.toISOString(),
            date: body.date,
            startTime: body.startTime || "16:00",
            endTime: body.endTime || "23:00",
            guestCount: body.guestCount ? parseInt(body.guestCount) : null,
            sectionType: body.sectionType,
            mealType: body.mealType,
            services: body.services,
            coffeeServers: body.coffeeServers ? parseInt(body.coffeeServers) : undefined,
            sacrifices: body.sacrifices ? parseInt(body.sacrifices) : undefined,
            waterCartons: body.waterCartons ? parseInt(body.waterCartons) : undefined,
            totalAmount,
            downPayment,
            discountAmount,
            vatAmount,
            finalAmount,
            serviceRevenue: parseFloat(body.serviceRevenue) || undefined,
            servicesBreakdown: body.servicesBreakdown,
            status: body.status || "TENTATIVE",
            notes: body.notes
        })

        return NextResponse.json(newBooking, { status: 201 })
    } catch (error) {
        console.error('Error creating booking:', error)
        return NextResponse.json({ error: 'Database operation failed', details: String(error) }, { status: 500 })
    }
}

// Helper to ensure a user exists for foreign keys
async function ensureSystemUser(): Promise<string> {
    try {
        const user = await prisma.user.findFirst()
        if (user) return user.id

        // Create dummy user if none exists (for dev only)
        const newUser = await prisma.user.create({
            data: {
                username: 'system',
                password: 'hashedpassword',
                nameAr: 'النظام',
                role: 'ADMIN'
            }
        })
        return newUser.id
    } catch (error) {
        console.error('Error ensuring system user:', error)
        return 'system'
    }
}
