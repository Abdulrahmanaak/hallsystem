import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Generate payment number: PAY-2025-0001
async function generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `PAY-${year}-`

    const lastPayment = await prisma.payment.findFirst({
        where: {
            paymentNumber: {
                startsWith: prefix
            }
        },
        orderBy: {
            paymentNumber: 'desc'
        }
    })

    let nextNumber = 1
    if (lastPayment) {
        const lastNumber = parseInt(lastPayment.paymentNumber.split('-')[2])
        nextNumber = lastNumber + 1
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// Update invoice status based on payments
async function updateInvoiceStatus(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            payments: {
                where: { isDeleted: false }
            }
        }
    })

    if (!invoice) return

    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const totalAmount = Number(invoice.totalAmount)

    let status = 'UNPAID'
    if (totalPaid >= totalAmount) {
        status = 'PAID'
    } else if (totalPaid > 0) {
        status = 'PARTIALLY_PAID'
    }

    await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
            paidAmount: totalPaid,
            status
        }
    })
}

// GET all payments
export async function GET() {
    try {
        const payments = await prisma.payment.findMany({
            where: {
                isDeleted: false
            },
            include: {
                booking: {
                    select: {
                        bookingNumber: true,
                        customer: { select: { nameAr: true } },
                        hall: { select: { nameAr: true } }
                    }
                },
                invoice: {
                    select: {
                        invoiceNumber: true
                    }
                }
            },
            orderBy: {
                paymentDate: 'desc'
            }
        })

        const formattedPayments = payments.map(payment => ({
            id: payment.id,
            paymentNumber: payment.paymentNumber,
            bookingId: payment.bookingId,
            bookingNumber: payment.booking.bookingNumber,
            customerName: payment.booking.customer.nameAr,
            hallName: payment.booking.hall.nameAr,
            invoiceId: payment.invoiceId,
            invoiceNumber: payment.invoice?.invoiceNumber,
            amount: Number(payment.amount),
            paymentMethod: payment.paymentMethod,
            paymentDate: payment.paymentDate.toISOString(),
            notes: payment.notes,
            syncedToQoyod: payment.syncedToQoyod,
            createdAt: payment.createdAt.toISOString()
        }))

        return NextResponse.json(formattedPayments)
    } catch (error) {
        console.error('Error fetching payments:', error)
        return NextResponse.json(
            { error: 'Failed to fetch payments' },
            { status: 500 }
        )
    }
}

// POST - Record new payment
export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Get admin user
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

        const paymentNumber = await generatePaymentNumber()

        const payment = await prisma.payment.create({
            data: {
                paymentNumber,
                bookingId: body.bookingId,
                invoiceId: body.invoiceId || null,
                amount: parseFloat(body.amount),
                paymentMethod: body.paymentMethod || 'CASH',
                paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
                notes: body.notes || null,
                createdById: adminUser.id
            },
            include: {
                booking: {
                    select: {
                        bookingNumber: true,
                        customer: { select: { nameAr: true } }
                    }
                }
            }
        })

        // Update invoice status if linked
        if (body.invoiceId) {
            await updateInvoiceStatus(body.invoiceId)
        }

        return NextResponse.json(payment, { status: 201 })
    } catch (error) {
        console.error('Error creating payment:', error)
        return NextResponse.json(
            { error: 'Failed to create payment' },
            { status: 500 }
        )
    }
}
