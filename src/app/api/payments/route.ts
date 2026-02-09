import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Filter by owner (SUPER_ADMIN sees all)
        const ownerFilter = session.user.role === 'SUPER_ADMIN' ? {} : { ownerId: session.user.ownerId }

        const payments = await prisma.payment.findMany({
            where: {
                isDeleted: false,
                ...ownerFilter
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

import { enforceSubscription } from '@/lib/subscription'

// POST - Record new payment
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

        const paymentNumber = await generatePaymentNumber()

        const payment = await prisma.payment.create({
            data: {
                paymentNumber,
                bookingId: body.bookingId,
                invoiceId: body.invoiceId || null,
                ownerId: session.user.ownerId, // Tenant isolation
                amount: parseFloat(body.amount),
                paymentMethod: body.paymentMethod || 'CASH',
                paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
                notes: body.notes || null,
                createdById: session.user.id
            },
            include: {
                booking: {
                    select: {
                        bookingNumber: true,
                        customer: { select: { nameAr: true } }
                    }
                },
                invoice: {
                    select: {
                        qoyodInvoiceId: true,
                        syncedToQoyod: true
                    }
                }
            }
        })

        // Update invoice status if linked
        if (body.invoiceId) {
            await updateInvoiceStatus(body.invoiceId)
        }

        // Auto-sync to Qoyod if enabled and invoice is synced
        try {
            const settings = await prisma.settings.findUnique({
                where: { ownerId: session.user.ownerId }
            })

            // Only sync if Qoyod is enabled, autoSync is on, and the invoice has been synced
            if (settings?.qoyodEnabled && settings?.qoyodAutoSync &&
                payment.invoice?.syncedToQoyod && payment.invoice?.qoyodInvoiceId) {
                // Trigger sync in background (don't block response)
                const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                fetch(`${baseUrl}/api/qoyod`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': request.headers.get('cookie') || ''
                    },
                    body: JSON.stringify({ type: 'payment', id: payment.id })
                }).catch(err => console.error('Auto-sync payment to Qoyod failed:', err))
            }
        } catch (syncError) {
            // Don't fail payment creation if sync check fails
            console.error('Error checking Qoyod auto-sync for payment:', syncError)
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
