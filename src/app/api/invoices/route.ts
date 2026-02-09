import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { enforceSubscription } from '@/lib/subscription'

// Generate invoice number: INV-2025-0001
async function generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `INV-${year}-`

    const lastInvoice = await prisma.invoice.findFirst({
        where: {
            invoiceNumber: {
                startsWith: prefix
            }
        },
        orderBy: {
            invoiceNumber: 'desc'
        }
    })

    let nextNumber = 1
    if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2])
        nextNumber = lastNumber + 1
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// GET all invoices
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Filter by owner (SUPER_ADMIN sees all)
        const ownerFilter = session.user.role === 'SUPER_ADMIN' ? {} : { ownerId: session.user.ownerId }

        const invoices = await prisma.invoice.findMany({
            where: {
                isDeleted: false,
                ...ownerFilter
            },
            include: {
                booking: {
                    select: {
                        bookingNumber: true,
                        finalAmount: true,
                        hall: { select: { nameAr: true } }
                    }
                },
                customer: {
                    select: {
                        nameAr: true,
                        phone: true
                    }
                },
                payments: {
                    where: { isDeleted: false },
                    select: {
                        amount: true,
                        paymentDate: true,
                        paymentMethod: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const formattedInvoices = invoices.map(invoice => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            bookingId: invoice.bookingId,
            bookingNumber: invoice.booking.bookingNumber,
            hallName: invoice.booking.hall.nameAr,
            bookingTotalAmount: Number(invoice.booking.finalAmount), // Included for Invoice View
            customerId: invoice.customerId,
            customerName: invoice.customer.nameAr,
            customerPhone: invoice.customer.phone,
            subtotal: Number(invoice.subtotal),
            discountAmount: Number(invoice.discountAmount),
            vatAmount: Number(invoice.vatAmount),
            totalAmount: Number(invoice.totalAmount),
            paidAmount: Number(invoice.paidAmount),
            remainingAmount: Number(invoice.totalAmount) - Number(invoice.paidAmount),
            issueDate: invoice.issueDate.toISOString(),
            dueDate: invoice.dueDate.toISOString(),
            status: invoice.status,
            syncedToQoyod: invoice.syncedToQoyod,
            paymentsCount: invoice.payments.length,
            createdAt: invoice.createdAt.toISOString()
        }))

        return NextResponse.json(formattedInvoices)
    } catch (error) {
        console.error('Error fetching invoices:', error)
        return NextResponse.json(
            { error: 'Failed to fetch invoices' },
            { status: 500 }
        )
    }
}

// POST - Create invoice from booking
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Check Subscription
        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const body = await request.json()

        // Get booking details
        const booking = await prisma.booking.findUnique({
            where: { id: body.bookingId },
            include: { customer: true }
        })

        if (!booking) {
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            )
        }

        // Check for existing invoices to calculate remaining amount (not to block new ones)
        const existingInvoices = await prisma.invoice.findMany({
            where: {
                bookingId: body.bookingId,
                isDeleted: false,
                status: { not: 'CANCELLED' }
            }
        })

        const totalInvoiced = existingInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
        const remainingUninvoiced = Number(booking.finalAmount) - totalInvoiced

        let invoiceAmount = 0
        let isFullInvoice = false

        if (body.amount) {
            invoiceAmount = parseFloat(body.amount)
        } else {
            invoiceAmount = remainingUninvoiced
            isFullInvoice = true
        }

        if (invoiceAmount <= 0) {
            return NextResponse.json(
                { error: 'تم إصدار فواتير بكامل مبلغ الحجز', remaining: remainingUninvoiced },
                { status: 400 }
            )
        }

        const invoiceNumber = await generateInvoiceNumber()

        // Generate payment number
        const year = new Date().getFullYear()
        const paymentPrefix = `PAY-${year}-`
        const lastPayment = await prisma.payment.findFirst({
            where: { paymentNumber: { startsWith: paymentPrefix } },
            orderBy: { paymentNumber: 'desc' }
        })
        let paymentNextNumber = 1
        if (lastPayment) {
            paymentNextNumber = parseInt(lastPayment.paymentNumber.split('-')[2]) + 1
        }
        const paymentNumber = `${paymentPrefix}${paymentNextNumber.toString().padStart(4, '0')}`

        // Payment date (use provided or today)
        const paymentDate = body.paymentDate ? new Date(body.paymentDate) : new Date()

        // Fetch settings for VAT percentage
        const settings = await prisma.settings.findUnique({
            where: { ownerId: session.user.ownerId }
        })
        const vatRate = (Number(settings?.vatPercentage) || 15) / 100

        // Calculate VAT (Inclusive)
        // Subtotal = Total / (1 + Rate)
        // VAT = Total - Subtotal
        const subtotal = invoiceAmount / (1 + vatRate)
        const vatAmount = invoiceAmount - subtotal

        // Use transaction to create both invoice and payment atomically
        const result = await prisma.$transaction(async (tx) => {
            // Create Invoice - always PAID since we're creating payment simultaneously
            const invoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    bookingId: booking.id,
                    customerId: booking.customerId,
                    ownerId: session.user.ownerId,
                    subtotal: subtotal,
                    discountAmount: 0,
                    vatAmount: vatAmount,
                    totalAmount: invoiceAmount,
                    paidAmount: invoiceAmount, // Fully paid
                    issueDate: new Date(),
                    dueDate: paymentDate,
                    status: 'PAID',
                    notes: body.notes || 'فاتورة دفعة',
                    createdById: session.user.id
                }
            })

            // Create Payment linked to this invoice
            const payment = await tx.payment.create({
                data: {
                    paymentNumber,
                    bookingId: booking.id,
                    invoiceId: invoice.id,
                    ownerId: session.user.ownerId,
                    amount: invoiceAmount,
                    paymentMethod: body.paymentMethod || 'CASH',
                    paymentDate,
                    notes: body.notes || 'دفعة فاتورة',
                    createdById: session.user.id
                }
            })

            return { invoice, payment }
        })

        const invoiceWithRelations = await prisma.invoice.findUnique({
            where: { id: result.invoice.id },
            include: {
                booking: { select: { bookingNumber: true } },
                customer: { select: { nameAr: true } }
            }
        })

        // Auto-sync to Qoyod if enabled
        try {
            const settings = await prisma.settings.findUnique({
                where: { ownerId: session.user.ownerId }
            })

            if (settings?.qoyodEnabled && settings?.qoyodAutoSync) {
                // Trigger sync in background (don't block response)
                const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                fetch(`${baseUrl}/api/qoyod`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': request.headers.get('cookie') || ''
                    },
                    body: JSON.stringify({ type: 'invoice', id: result.invoice.id })
                }).catch(err => console.error('Auto-sync to Qoyod failed:', err))
            }
        } catch (syncError) {
            // Don't fail invoice creation if sync check fails
            console.error('Error checking Qoyod auto-sync:', syncError)
        }

        return NextResponse.json(invoiceWithRelations, { status: 201 })
    } catch (error) {
        console.error('Error creating invoice:', error)
        return NextResponse.json(
            { error: 'Failed to create invoice' },
            { status: 500 }
        )
    }
}
