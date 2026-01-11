import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Configuration
const QOYOD_API_BASE = process.env.QOYOD_BASE_URL || 'https://api.qoyod.com/2.0'

interface QoyodConfig {
    apiKey: string
    baseUrl: string
}

// Get Qoyod config from user settings
async function getQoyodConfig(): Promise<QoyodConfig | null> {
    const session = await auth()
    if (!session?.user?.ownerId) {
        return null
    }

    const settings = await prisma.settings.findUnique({
        where: { ownerId: session.user.ownerId }
    })

    if (!settings?.qoyodEnabled || !settings?.qoyodApiKey) {
        return null
    }

    return {
        apiKey: settings.qoyodApiKey,
        baseUrl: QOYOD_API_BASE
    }
}

// Qoyod API request helper
async function qoyodRequest(endpoint: string, method: string = 'GET', body: any = null, config: QoyodConfig) {
    const baseUrl = config.baseUrl.replace(/\/+$/, '')
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${baseUrl}${cleanEndpoint}`

    const headers: HeadersInit = {
        'API-KEY': config.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Qoyod API Error: ${response.status} - ${errorText}`)
    }

    return await response.json()
}

// POST - Create Credit Note for cancelled invoice
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        const body = await request.json()
        const { invoiceId, reason } = body

        if (!invoiceId) {
            return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
        }

        const config = await getQoyodConfig()
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

        // Create credit note in Qoyod
        // Based on Qoyod API docs: POST /credit_notes
        const creditNotePayload = {
            credit_note: {
                contact_id: invoice.customer.qoyodCustomerId,
                invoice_id: invoice.qoyodInvoiceId,
                issue_date: new Date().toISOString().split('T')[0],
                reference: `CN-${invoice.invoiceNumber}`,
                notes: reason || `إشعار دائن للفاتورة ${invoice.invoiceNumber}`,
                status: 'Approved',
                line_items: [
                    {
                        description: `إلغاء فاتورة: ${invoice.invoiceNumber} - ${invoice.booking.hall.nameAr}`,
                        quantity: 1,
                        unit_price: Number(invoice.subtotal),
                        tax_percent: 15
                    }
                ]
            }
        }

        const qoyodRes = await qoyodRequest('/credit_notes', 'POST', creditNotePayload, config)
        const qoyodCreditNoteId = qoyodRes.credit_note?.id

        // Update invoice status to CANCELLED
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
                qoyodId: qoyodCreditNoteId?.toString() || null,
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

    } catch (error: any) {
        console.error('Credit Note Error:', error)

        return NextResponse.json(
            { error: error.message || 'Failed to create credit note' },
            { status: 500 }
        )
    }
}
