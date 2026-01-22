import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single invoice with full details
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                booking: {
                    include: {
                        hall: true,
                        payments: {
                            where: { isDeleted: false },
                            orderBy: { paymentDate: 'desc' }
                        },
                        invoices: {
                            where: {
                                isDeleted: false,
                                status: { not: 'CANCELLED' }
                            },
                            select: {
                                id: true,
                                paidAmount: true,
                                totalAmount: true,
                                status: true
                            }
                        }
                    }
                },
                customer: true,
                payments: {
                    where: { isDeleted: false },
                    orderBy: { paymentDate: 'desc' }
                }
            }
        })

        if (!invoice || invoice.isDeleted) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(invoice)
    } catch (error) {
        console.error('Error fetching invoice:', error)
        return NextResponse.json(
            { error: 'Failed to fetch invoice' },
            { status: 500 }
        )
    }
}

// PUT - Update invoice (mainly for notes and due date)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const updateData: Record<string, unknown> = {}

        if (body.dueDate) updateData.dueDate = new Date(body.dueDate)
        if (body.notes !== undefined) updateData.notes = body.notes

        const invoice = await prisma.invoice.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json(invoice)
    } catch (error) {
        console.error('Error updating invoice:', error)
        return NextResponse.json(
            { error: 'Failed to update invoice' },
            { status: 500 }
        )
    }
}

// DELETE - Cancel/Delete invoice (only if not synced to Qoyod)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Check if invoice is synced to Qoyod
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            select: { syncedToQoyod: true, qoyodInvoiceId: true }
        })

        if (!invoice) {
            return NextResponse.json(
                { error: 'الفاتورة غير موجودة' },
                { status: 404 }
            )
        }

        if (invoice.syncedToQoyod) {
            return NextResponse.json(
                { error: 'لا يمكن حذف فاتورة مزامنة مع قيود. يرجى حذفها من قيود أولاً.' },
                { status: 400 }
            )
        }

        await prisma.invoice.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                status: 'CANCELLED'
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error cancelling invoice:', error)
        return NextResponse.json(
            { error: 'Failed to cancel invoice' },
            { status: 500 }
        )
    }
}
