import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { enforceSubscription } from '@/lib/subscription'
import { createNotificationForTeam } from '@/lib/services/notification'
import { generateBookingNumber, generateInvoiceNumber, generatePaymentNumber } from '@/lib/number-generator'
import { calculateVATFromInclusive, getVATRate } from '@/lib/vat'
import { createBookingSchema, validateBody } from '@/lib/validations'

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

        return NextResponse.json(formattedBookings)
    } catch (error) {
        console.error('Error fetching bookings:', error)
        return NextResponse.json([], { status: 500 })
    }
}

// POST - Create new booking
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Check Subscription
        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const ownerId = session.user.ownerId
        const rawBody = await request.json()
        const validated = validateBody(createBookingSchema, rawBody)
        if (!validated.success) {
            return NextResponse.json({ error: validated.error }, { status: 400 })
        }
        const body = validated.data

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

        // Calculate amounts
        const totalAmount = Number(body.totalAmount) || 0
        const discountAmount = Number(body.discountAmount) || 0
        const downPayment = Number(body.downPayment) || 0
        const vatAmount = Number(body.vatAmount) || 0
        const finalAmount = totalAmount - discountAmount

        // Date logic
        const eventDate = new Date(body.date)
        const [startHours, startMinutes] = (body.startTime || "16:00").split(':').map(Number)
        const startTime = new Date(eventDate)
        startTime.setHours(startHours, startMinutes, 0, 0)

        const [endHours, endMinutes] = (body.endTime || "23:00").split(':').map(Number)
        const endTime = new Date(eventDate)
        endTime.setHours(endHours, endMinutes, 0, 0)

        // Fetch settings for VAT calculation on down payment
        const settings = await prisma.settings.findUnique({
            where: { ownerId: ownerId }
        })
        const vatRate = getVATRate(settings?.vatPercentage)

        // Use transaction to ensure booking, invoice, and payment (if applicable) are created together
        // Number generation inside transaction to prevent race conditions
        const result = await prisma.$transaction(async (tx) => {
            const bookingNumber = await generateBookingNumber(tx)

            // 1. Create Booking
            const booking = await tx.booking.create({
                data: {
                    bookingNumber,
                    customerId,
                    hallId: body.hallId,
                    ownerId: ownerId, // Tenant isolation
                    eventType: body.eventType,
                    eventDate,
                    startTime,
                    endTime,
                    guestCount: body.guestCount ? Number(body.guestCount) : null,
                    sectionType: body.sectionType,
                    mealType: body.mealType,
                    services: body.services ? JSON.stringify(body.services) : null,
                    coffeeServers: body.coffeeServers ? Number(body.coffeeServers) : null,
                    sacrifices: body.sacrifices ? Number(body.sacrifices) : null,
                    waterCartons: body.waterCartons ? Number(body.waterCartons) : null,
                    totalAmount,
                    downPayment,
                    discountAmount,
                    vatAmount,
                    finalAmount,
                    serviceRevenue: Number(body.serviceRevenue) || 0,
                    servicesBreakdown: body.servicesBreakdown || null,
                    status: downPayment > 0 ? "CONFIRMED" : "TENTATIVE",
                    notes: body.notes || null,
                    createdById: session.user.id
                },
                include: {
                    customer: { select: { nameAr: true } },
                    hall: { select: { nameAr: true } }
                }
            })

            // 2. If Down Payment > 0, Create Invoice & Payment
            if (downPayment > 0) {
                // Generate numbers inside transaction to prevent race conditions
                const invoiceNumber = await generateInvoiceNumber(tx)
                const paymentNumber = await generatePaymentNumber(tx)

                // Calculate VAT for down payment (VAT-inclusive, same as all amounts)
                const dpVat = calculateVATFromInclusive(downPayment, vatRate)

                const invoice = await tx.invoice.create({
                    data: {
                        invoiceNumber,
                        bookingId: booking.id,
                        customerId: customerId,
                        ownerId: ownerId,
                        subtotal: dpVat.subtotal,
                        totalAmount: downPayment,
                        paidAmount: downPayment,
                        vatAmount: dpVat.vatAmount,
                        status: 'PAID',
                        issueDate: new Date(),
                        dueDate: new Date(),
                        notes: 'عربون حجز - إنشاء تلقائي',
                        createdById: session.user.id
                    }
                })

                await tx.payment.create({
                    data: {
                        paymentNumber,
                        bookingId: booking.id,
                        invoiceId: invoice.id,
                        ownerId: ownerId,
                        amount: downPayment,
                        paymentMethod: body.paymentMethod || 'CASH',
                        paymentDate: new Date(),
                        notes: 'دفعة عربون عند الحجز',
                        createdById: session.user.id
                    }
                })

                return { booking, downPaymentInvoiceId: invoice.id }
            }

            return { booking, downPaymentInvoiceId: null }
        })

        // Auto-sync down payment invoice to Qoyod if enabled
        if (result.downPaymentInvoiceId && settings?.qoyodEnabled && settings?.qoyodAutoSync) {
            const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            fetch(`${baseUrl}/api/qoyod`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.get('cookie') || ''
                },
                body: JSON.stringify({ type: 'invoice', id: result.downPaymentInvoiceId })
            }).catch(async (err) => {
                console.error('Auto-sync down payment invoice failed:', err)
                try {
                    await prisma.accountingSync.create({
                        data: {
                            syncType: 'CREATE',
                            recordType: 'Invoice',
                            recordId: result.downPaymentInvoiceId!,
                            status: 'FAILED',
                            errorMessage: err instanceof Error ? err.message : String(err),
                            requestData: JSON.stringify({ type: 'invoice', id: result.downPaymentInvoiceId, trigger: 'auto-sync-downpayment' }),
                            completedAt: new Date()
                        }
                    })
                } catch (logErr) {
                    console.error('Failed to log sync error:', logErr)
                }
            })
        }

        // Send notification (fire-and-forget, don't block response)
        createNotificationForTeam({
            type: 'NEW_BOOKING',
            title: 'حجز جديد',
            message: `حجز جديد رقم ${result.booking.bookingNumber} - ${result.booking.customer.nameAr} في قاعة ${result.booking.hall.nameAr}`,
            ownerId: session.user.ownerId,
            metadata: { bookingId: result.booking.id, bookingNumber: result.booking.bookingNumber },
            link: `/dashboard/bookings?id=${result.booking.id}`,
        }).catch(err => console.error('[NOTIF_ERROR] NEW_BOOKING:', err))

        return NextResponse.json(result.booking, { status: 201 })
    } catch (error) {
        console.error('Error creating booking:', error)
        console.error('Error creating booking:', error)
        return NextResponse.json({ error: 'فشل في إنشاء الحجز' }, { status: 500 })
    }
}
