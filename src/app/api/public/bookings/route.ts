import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            customerName,
            customerPhone,
            customerIdNumber,
            date,
            eventType,
            hallId,
            guestCount,
            sectionType
        } = body

        // 1. Validate required fields
        if (!customerName || !customerPhone || !customerIdNumber || !date || !eventType || !hallId) {
            return NextResponse.json({ error: 'جميع الحقول الأساسية مطلوبة' }, { status: 400 })
        }

        // 2. Fetch the Hall to get the ownerId and pricing config
        const hall = await prisma.hall.findUnique({
            where: { id: hallId, status: 'ACTIVE', isDeleted: false }
        })

        if (!hall) {
            return NextResponse.json({ error: 'عذراً، هذه القاعة غير متاحة للحجز حالياً' }, { status: 404 })
        }

        // 3. Handle Customer Record
        // Check if customer exists for this tenant
        let customer = await prisma.customer.findFirst({
            where: {
                phone: customerPhone,
                ownerId: hall.ownerId,
                isDeleted: false
            }
        })

        // If not, create a new customer
        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    nameAr: customerName,
                    phone: customerPhone,
                    idNumber: customerIdNumber,
                    ownerId: hall.ownerId,
                    createdById: hall.ownerId, // Using owner as creator for public submissions
                    customerType: 'INDIVIDUAL'
                }
            })
        }

        // 4. Calculate approximate pricing based on default hall config
        // NOTE: The hall owner will adjust this later, but we need a base total.
        const basePrice = Number(hall.basePrice)
        const sectionSurcharge = sectionType === 'both' ? Number(hall.extraSectionPrice || 1000) : 0
        const totalAmount = basePrice + sectionSurcharge

        // Assume VAT is included in basePrice for standard operation here
        const vatAmount = Math.round(totalAmount / 1.15 * 0.15)

        // Generate a new booking number
        const year = new Date().getFullYear()
        const count = await prisma.booking.count({
            where: {
                ownerId: hall.ownerId,
                createdAt: { gte: new Date(`${year}-01-01`) }
            }
        })
        const bookingNumber = `BK-${year}-${(count + 1).toString().padStart(4, '0')}`

        // 5. Create the Booking as PENDING
        const booking = await prisma.booking.create({
            data: {
                bookingNumber,
                customerId: customer.id,
                hallId: hall.id,
                ownerId: hall.ownerId,
                eventType,
                eventDate: new Date(date),
                startTime: new Date(`${date}T16:00:00`), // Default start
                endTime: new Date(`${date}T23:59:00`),   // Default end
                status: 'PENDING',
                totalAmount,
                discountAmount: 0,
                vatAmount,
                finalAmount: totalAmount,
                downPayment: 0,
                serviceRevenue: 0,
                guestCount: guestCount || hall.defaultGuestCount || hall.capacity || 0,
                sectionType: sectionType || hall.defaultSectionType || 'both',
                notes: 'تم الطلب عبر رابط الحجز العام',
                createdById: hall.ownerId // Attribution
            }
        })

        // Track the initial status
        await prisma.bookingStatusHistory.create({
            data: {
                bookingId: booking.id,
                fromStatus: null,
                toStatus: 'PENDING',
                notes: 'طلب حجز جديد من الرابط العام',
                createdById: hall.ownerId
            }
        })

        return NextResponse.json({ success: true, bookingId: booking.id }, { status: 201 })

    } catch (error) {
        console.error('Public booking submission error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ أثناء إرسال طلب الحجز، يرجى المحاولة لاحقاً' },
            { status: 500 }
        )
    }
}
