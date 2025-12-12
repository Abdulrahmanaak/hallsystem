import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

// GET single payment
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const payment = await prisma.payment.findUnique({
            where: { id },
            include: {
                booking: {
                    include: {
                        customer: true,
                        hall: true
                    }
                },
                invoice: true
            }
        })

        if (!payment || payment.isDeleted) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(payment)
    } catch (error) {
        console.error('Error fetching payment:', error)
        return NextResponse.json(
            { error: 'Failed to fetch payment' },
            { status: 500 }
        )
    }
}

// DELETE - Cancel payment
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const payment = await prisma.payment.findUnique({
            where: { id }
        })

        if (!payment) {
            return NextResponse.json(
                { error: 'Payment not found' },
                { status: 404 }
            )
        }

        await prisma.payment.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date()
            }
        })

        // Update invoice status
        if (payment.invoiceId) {
            await updateInvoiceStatus(payment.invoiceId)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting payment:', error)
        return NextResponse.json(
            { error: 'Failed to delete payment' },
            { status: 500 }
        )
    }
}
