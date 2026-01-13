import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Configuration
const QOYOD_API_BASE = process.env.QOYOD_BASE_URL || 'https://api.qoyod.com/2.0'

interface QoyodConfig {
    apiKey: string
    baseUrl: string
    defaultBankAccountId?: string | null
    defaultSalesAccountId?: string | null
    autoSync?: boolean
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
        baseUrl: QOYOD_API_BASE,
        defaultBankAccountId: settings.qoyodDefaultBankAccountId,
        defaultSalesAccountId: settings.qoyodDefaultSalesAccountId,
        autoSync: settings.qoyodAutoSync
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

// 2.5 Helper: Get Sales Account ID
async function getSalesAccountId(config: QoyodConfig): Promise<number> {
    // Use configured account if available
    if (config.defaultSalesAccountId) {
        return parseInt(config.defaultSalesAccountId)
    }

    try {
        // Search for Revenue accounts
        const res = await qoyodRequest('/accounts?q[type_eq]=Revenue', 'GET', null, config)
        if (res.accounts && res.accounts.length > 0) {
            // Prefer "Revenue of Products..." or generic Sales
            const salesAcc = res.accounts.find((a: any) => a.name_en?.toLowerCase().includes('sales') || a.name_ar?.includes('مبيعات'))
            return salesAcc ? salesAcc.id : res.accounts[0].id
        }
    } catch (e) {
        console.warn('Failed to fetch sales accounts, using fallback')
    }
    return 17 // Fallback to common default
}

// 2.7 Helper: Get Unit Type ID
async function getUnitTypeId(config: QoyodConfig): Promise<number> {
    try {
        const res = await qoyodRequest('/product_unit_types', 'GET', null, config)
        if (res.product_unit_types && res.product_unit_types.length > 0) {
            // Look for "Service" or "Unit" or "Piece"
            const unit = res.product_unit_types.find((u: any) =>
                u.unit_name?.toLowerCase().includes('service') ||
                u.unit_name?.toLowerCase().includes('unit') ||
                u.unit_name?.toLowerCase().includes('piece')
            )
            return unit ? unit.id : res.product_unit_types[0].id
        }
    } catch (e) {
        console.warn('Failed to fetch unit types, using fallback')
    }
    return 7 // Fallback
}

// 2.8 Helper: Get Inventory ID (required for invoices)
async function getInventoryId(config: QoyodConfig): Promise<number> {
    try {
        const res = await qoyodRequest('/inventories', 'GET', null, config)
        if (res.inventories && res.inventories.length > 0) {
            // Return first inventory
            return res.inventories[0].id
        }
    } catch (e) {
        console.warn('Failed to fetch inventories, using fallback')
    }
    return 1 // Fallback to default inventory
}

// 3. Helper: Ensure Product exists (for line items)
async function getOrCreateServiceProduct(config: QoyodConfig) {
    const productName = 'خدمة حجز قاعة' // Hall Booking Service
    const productSku = 'HALL-SVC-001' // Use a specific SKU for services

    // Search for our specific service product
    let searchRes
    try {
        searchRes = await qoyodRequest(`/products?q[sku_eq]=${productSku}`, 'GET', null, config)
    } catch (e: any) {
        if (e.message.includes('404') || e.message.includes('nothing')) {
            searchRes = { products: [] }
        } else {
            throw e
        }
    }

    if (searchRes.products && searchRes.products.length > 0) {
        const product = searchRes.products[0]

        // Check if product has inventory tracking disabled
        const trackQty = product.track_quantity
        if (trackQty === false || trackQty === '0' || trackQty === 0 || trackQty === 'false') {
            // Product is correctly configured as service
            return product.id
        }

        // Try to fix the product settings
        try {
            await qoyodRequest(`/products/${product.id}`, 'PUT', {
                product: {
                    track_quantity: false,
                    type: 'Service'
                }
            }, config)
            return product.id
        } catch (e) {
            console.warn('Could not update product, will create a new one:', e)
        }
    }

    // Prepare dependencies for creating new product
    const salesAccountId = await getSalesAccountId(config)
    const unitTypeId = await getUnitTypeId(config)

    // Create new service product
    const createRes = await qoyodRequest('/products', 'POST', {
        product: {
            name_ar: productName,
            name_en: 'Hall Booking Service',
            sku: productSku,
            category_id: 1,
            type: 'Service',
            product_unit_type_id: unitTypeId,
            sale_item: true,
            sales_account_id: salesAccountId,
            selling_price: 1.0,
            purchase_item: false,
            track_quantity: false,
            tax_id: 1 // 15% VAT
        }
    }, config)

    return createRes.product.id
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

        // Get required IDs for credit note line items
        const serviceProductId = await getOrCreateServiceProduct(config)
        const inventoryId = await getInventoryId(config)

        // Create credit note in Qoyod
        // Based on Qoyod API docs: POST /credit_notes
        const creditNotePayload = {
            credit_note: {
                contact_id: invoice.customer.qoyodCustomerId,
                invoice_id: invoice.qoyodInvoiceId,
                issue_date: new Date().toISOString().split('T')[0],
                reference: `CN-${invoice.invoiceNumber}`,
                notes: reason || `إشعار دائن للفاتورة ${invoice.invoiceNumber}`,
                status: 'Draft',
                inventory_id: inventoryId,
                line_items: [
                    {
                        product_id: serviceProductId,
                        description: `إلغاء فاتورة: ${invoice.invoiceNumber} - ${invoice.booking.hall.nameAr}`,
                        quantity: 1,
                        unit_price: Number(invoice.totalAmount),
                        tax_percent: 0 // VAT already included
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
