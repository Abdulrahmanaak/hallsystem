import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientId } from '@/lib/rate-limit'
import { generateBookingNumber } from '@/lib/number-generator'
import { calculateVATFromInclusive, getVATRate } from '@/lib/vat'

export async function POST(request: Request) {
    // Strict rate limit for public endpoint: 10 req/min
    const limited = await rateLimit(`public:${getClientId(request)}`, { maxRequests: 10, windowMs: 60_000 })
    if (limited) return limited

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
        const basePrice = Number(hall.basePrice)
        const sectionSurcharge = sectionType === 'both' ? Number(hall.extraSectionPrice || 1000) : 0
        const totalAmount = basePrice + sectionSurcharge

        // Use shared VAT utility (VAT-inclusive pricing)
        const settings = await prisma.settings.findUnique({ where: { ownerId: hall.ownerId } })
        const vatRate = getVATRate(settings?.vatPercentage)
        const vat = calculateVATFromInclusive(totalAmount, vatRate)

        // 5. Create Booking inside transaction for safe number generation
        const booking = await prisma.$transaction(async (tx) => {
            const bookingNumber = await generateBookingNumber(tx)

            const newBooking = await tx.booking.create({
                data: {
                    bookingNumber,
                    customerId: customer.id,
                    hallId: hall.id,
                    ownerId: hall.ownerId,
                    eventType,
                    eventDate: new Date(date),
                    startTime: new Date(`${date}T16:00:00`),
                    endTime: new Date(`${date}T23:59:00`),
                    status: 'TENTATIVE',
                    totalAmount,
                    discountAmount: 0,
                    vatAmount: vat.vatAmount,
                    finalAmount: totalAmount,
                    downPayment: 0,
                    serviceRevenue: 0,
                    guestCount: guestCount || hall.defaultGuestCount || hall.capacity || 0,
                    sectionType: sectionType || hall.defaultSectionType || 'both',
                    notes: 'تم الطلب عبر رابط الحجز العام',
                    createdById: hall.ownerId
                }
            })

            await tx.bookingStatusHistory.create({
                data: {
                    bookingId: newBooking.id,
                    fromStatus: null,
                    toStatus: 'TENTATIVE',
                    notes: 'طلب حجز جديد من الرابط العام',
                    createdById: hall.ownerId
                }
            })

            return newBooking
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
