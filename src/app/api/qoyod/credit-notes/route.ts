import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getQoyodConfig, qoyodRequest, getOrCreateServiceProduct, getInventoryId } from '@/lib/services/qoyod'
import { creditNoteSchema, validateBody } from '@/lib/validations'
import { createTenantLogger } from '@/lib/logger'

const log = createTenantLogger({ module: 'credit-notes' })

// POST - Create Credit Note for cancelled invoice
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const rawBody = await request.json()
        const validated = validateBody(creditNoteSchema, rawBody)
        if (!validated.success) {
            return NextResponse.json({ error: validated.error }, { status: 400 })
        }
        const body = validated.data
        const { invoiceId, reason } = body

        const config = await getQoyodConfig(session.user.ownerId)
        if (!config) {
            return NextResponse.json({ error: 'Qoyod not configured' }, { status: 400 })
        }

        // Fetch the invoice with Qoyod details
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                customer: true,
                booking: { include: { hall: true } }
            }
        })

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        if (!invoice.syncedToQoyod || !invoice.qoyodInvoiceId) {
            return NextResponse.json({
                error: 'Invoice must be synced to Qoyod before creating a credit note'
            }, { status: 400 })
        }

        // Get required IDs for credit note line items
        const serviceProductId = await getOrCreateServiceProduct(config)
        const inventoryId = await getInventoryId(config)

        // Get VAT percentage to match original invoice
        const settings = await prisma.settings.findUnique({
            where: { ownerId: session.user.ownerId }
        })
        const vatPercentage = Number(settings?.vatPercentage) || 15

        // Create credit note in Qoyod
        // Credit note must mirror the original invoice's tax treatment
        const creditNotePayload = {
            credit_note: {
                contact_id: invoice.customer.qoyodCustomerId,
                invoice_id: invoice.qoyodInvoiceId,
                issue_date: new Date().toISOString().split('T')[0],
                reference: `CN-${invoice.invoiceNumber}`,
                notes: reason || `إشعار دائن للفاتورة ${invoice.invoiceNumber}`,
                status: 'Draft',
                inventory_id: inventoryId,
                tax_inclusive: true,
                line_items: [
                    {
                        product_id: serviceProductId,
                        description: `إلغاء فاتورة: ${invoice.invoiceNumber} - ${invoice.booking.hall.nameAr}`,
                        quantity: 1,
                        unit_price: Number(invoice.totalAmount),
                        tax_percent: vatPercentage
                    }
                ]
            }
        }

        let qoyodRes
        let qoyodCreditNoteId: string | undefined
        try {
            qoyodRes = await qoyodRequest('/credit_notes', 'POST', creditNotePayload, config)
            qoyodCreditNoteId = qoyodRes.credit_note?.id?.toString()
        } catch (qoyodError) {
            // Log failed attempt - do NOT update invoice status since Qoyod failed
            await prisma.accountingSync.create({
                data: {
                    syncType: 'CREATE',
                    recordType: 'CreditNote',
                    recordId: invoiceId,
                    status: 'FAILED',
                    errorMessage: qoyodError instanceof Error ? qoyodError.message : String(qoyodError),
                    requestData: JSON.stringify(creditNotePayload),
                    completedAt: new Date()
                }
            })
            throw qoyodError
        }

        // Only update invoice status AFTER Qoyod confirms credit note creation
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                status: 'CANCELLED',
                notes: `${invoice.notes || ''}\nإشعار دائن: ${qoyodCreditNoteId || 'N/A'} - ${reason || 'تم الإلغاء'}`
            }
        })

        // Log the sync
        await prisma.accountingSync.create({
            data: {
                syncType: 'CREATE',
                recordType: 'CreditNote',
                recordId: invoiceId,
                status: 'SUCCESS',
                qoyodId: qoyodCreditNoteId || null,
                requestData: JSON.stringify(creditNotePayload),
                responseData: JSON.stringify(qoyodRes),
                completedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            qoyodCreditNoteId,
            message: 'تم إنشاء إشعار دائن بنجاح'
        })

    } catch (error: unknown) {
        log.error({ err: error }, 'Credit note error')

        return NextResponse.json(
            { error: 'فشل في إنشاء إشعار دائن' },
            { status: 500 }
        )
    }
}
