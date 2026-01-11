import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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

        // Check if invoice already exists for this booking
        const existingInvoice = await prisma.invoice.findFirst({
            where: {
                bookingId: body.bookingId,
                isDeleted: false
            }
        })

        if (existingInvoice) {
            return NextResponse.json(
                { error: 'فاتورة موجودة مسبقاً لهذا الحجز', existingId: existingInvoice.id },
                { status: 400 }
            )
        }

        const invoiceNumber = await generateInvoiceNumber()

        // Calculate due date (default 7 days from now)
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 7)

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                bookingId: booking.id,
                customerId: booking.customerId,
                ownerId: session.user.ownerId, // Tenant isolation
                subtotal: booking.totalAmount,
                discountAmount: booking.discountAmount,
                vatAmount: booking.vatAmount,
                totalAmount: booking.finalAmount,
                paidAmount: 0,
                issueDate: new Date(),
                dueDate: body.dueDate ? new Date(body.dueDate) : dueDate,
                status: 'UNPAID',
                notes: body.notes || null,
                createdById: session.user.id
            },
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
                    body: JSON.stringify({ type: 'invoice', id: invoice.id })
                }).catch(err => console.error('Auto-sync to Qoyod failed:', err))
            }
        } catch (syncError) {
            // Don't fail invoice creation if sync check fails
            console.error('Error checking Qoyod auto-sync:', syncError)
        }

        return NextResponse.json(invoice, { status: 201 })
    } catch (error) {
        console.error('Error creating invoice:', error)
        return NextResponse.json(
            { error: 'Failed to create invoice' },
            { status: 500 }
        )
    }
}
