import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Configuration - only base URL from environment (same for all users)
// New Qoyod API: https://api.qoyod.com (migrated from www.qoyod.com/api)
const QOYOD_API_BASE = process.env.QOYOD_BASE_URL || 'https://api.qoyod.com/2.0'

// Types
interface QoyodConfig {
    apiKey: string
    baseUrl: string
    defaultBankAccountId?: string | null
    defaultSalesAccountId?: string | null
    autoSync?: boolean
}

interface QoyodSettings {
    qoyodApiKey: string | null
    qoyodEnabled: boolean
    qoyodDefaultBankAccountId: string | null
    qoyodDefaultSalesAccountId: string | null
    qoyodAutoSync: boolean
}

// 1. Configuration & Auth - reads from user's settings in database
async function getQoyodConfig(): Promise<QoyodConfig | null> {
    const session = await auth()
    if (!session?.user?.ownerId) {
        return null
    }

    const settings = await prisma.settings.findUnique({
        where: { ownerId: session.user.ownerId }
    }) as QoyodSettings | null

    // User must configure Qoyod in Settings page
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

// 2. Helper: API Request
async function qoyodRequest(endpoint: string, method: string = 'GET', body: any = null, config: QoyodConfig) {
    // Ensure no double slashes in URL
    const baseUrl = config.baseUrl.replace(/\/+$/, '') // Remove trailing slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${baseUrl}${cleanEndpoint}`

    const headers: HeadersInit = {
        'API-KEY': config.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`Qoyod API Error [${method} ${url}]:`, response.status, errorText)
            throw new Error(`Qoyod APi Error: ${response.status} - ${errorText}`)
        }

        return await response.json()
    } catch (error) {
        console.error('Qoyod Request Failed:', error)
        throw error
    }
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

// 2.6 Helper: Get Bank/Cash Account ID for payments
async function getBankAccountId(config: QoyodConfig): Promise<number> {
    // Use configured account if available
    if (config.defaultBankAccountId) {
        return parseInt(config.defaultBankAccountId)
    }

    try {
        const res = await qoyodRequest('/accounts?q[type_eq]=Asset', 'GET', null, config)
        if (res.accounts && res.accounts.length > 0) {
            // Prefer Cash or Bank accounts
            const bankAcc = res.accounts.find((a: any) =>
                a.name_en?.toLowerCase().includes('cash') ||
                a.name_en?.toLowerCase().includes('bank') ||
                a.name_ar?.includes('صندوق') ||
                a.name_ar?.includes('بنك')
            )
            return bankAcc ? bankAcc.id : res.accounts[0].id
        }
    } catch (e) {
        console.warn('Failed to fetch bank accounts, using fallback')
    }
    return 1 // Fallback to default
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
        console.log(`Product ${product.id} has track_quantity=${trackQty}, attempting fix...`)
        try {
            await qoyodRequest(`/products/${product.id}`, 'PUT', {
                product: {
                    track_quantity: false,
                    type: 'Service'
                }
            }, config)
            console.log('Product settings updated successfully')
            return product.id
        } catch (e) {
            console.warn('Could not update product, will create a new one:', e)
        }
    }

    // Prepare dependencies for creating new product
    const salesAccountId = await getSalesAccountId(config)
    const unitTypeId = await getUnitTypeId(config)

    // Create new service product
    console.log('Creating new service product in Qoyod...')
    const createRes = await qoyodRequest('/products', 'POST', {
        product: {
            name_ar: productName,
            name_en: 'Hall Booking Service',
            sku: productSku,
            category_id: 1,
            type: 'Service',
            product_unit_type_id: unitTypeId,

            // Selling configuration
            sale_item: true,
            sales_account_id: salesAccountId,
            selling_price: 1.0,

            // CRITICAL: Disable inventory tracking for services
            purchase_item: false,
            track_quantity: false,

            tax_id: 1 // 15% VAT
        }
    }, config)

    console.log('Service product created:', createRes.product?.id)
    return createRes.product.id
}

// 4. Helper: Sync Customer
async function syncCustomer(customerId: string, config: QoyodConfig): Promise<number> {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (!customer) throw new Error('Customer not found')

    // If already synced, return the existing Qoyod ID
    if (customer.qoyodCustomerId) {
        return parseInt(customer.qoyodCustomerId)
    }

    // Prepare Name
    const contactName = customer.nameAr

    // 1. Search by name or phone
    let searchRes
    try {
        searchRes = await qoyodRequest(`/customers?q[name_eq]=${encodeURIComponent(contactName)}`, 'GET', null, config)
    } catch (e: any) {
        // If 404 or empty result, proceed to create
        if (e.message.includes('404')) {
            searchRes = { customers: [] }
        } else {
            throw e
        }
    }

    let qoyodCustomerId: number

    if (searchRes.customers && searchRes.customers.length > 0) {
        qoyodCustomerId = searchRes.customers[0].id
    } else {
        // 2. Create if not found
        const createRes = await qoyodRequest('/customers', 'POST', {
            contact: {
                name: contactName, // Localised name
                organization: contactName,
                email: customer.email || undefined,
                phone_number: customer.phone,
                status: 'Active'
            }
        }, config)
        qoyodCustomerId = createRes.contact.id
    }

    // Store Qoyod customer ID in our database
    await prisma.customer.update({
        where: { id: customerId },
        data: {
            qoyodCustomerId: qoyodCustomerId.toString(),
            syncedToQoyod: true,
            lastSyncAt: new Date()
        }
    })

    return qoyodCustomerId
}

// API Route Handlers
// ============================================

// GET - Test Connection or Fetch Accounts
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action')

        const config = await getQoyodConfig()

        if (!config) {
            return NextResponse.json({
                connected: false,
                message: 'لم يتم تفعيل تكامل قيود'
            })
        }

        // Action: Fetch accounts for settings dropdown
        if (action === 'accounts') {
            try {
                const [revenueRes, assetRes] = await Promise.all([
                    qoyodRequest('/accounts?q[type_eq]=Revenue', 'GET', null, config),
                    qoyodRequest('/accounts?q[type_eq]=Asset', 'GET', null, config)
                ])

                return NextResponse.json({
                    success: true,
                    revenueAccounts: revenueRes.accounts || [],
                    assetAccounts: assetRes.accounts || []
                })
            } catch (e: any) {
                return NextResponse.json({
                    success: false,
                    error: e.message || 'Failed to fetch accounts'
                }, { status: 500 })
            }
        }

        // Action: Get sync status
        if (action === 'sync-status') {
            const session = await auth()
            if (!session?.user?.ownerId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            const [invoiceStats, paymentStats, customerStats] = await Promise.all([
                prisma.invoice.groupBy({
                    by: ['syncedToQoyod'],
                    where: { ownerId: session.user.ownerId, isDeleted: false },
                    _count: true
                }),
                prisma.payment.groupBy({
                    by: ['syncedToQoyod'],
                    where: { ownerId: session.user.ownerId, isDeleted: false },
                    _count: true
                }),
                prisma.customer.groupBy({
                    by: ['syncedToQoyod'],
                    where: { ownerId: session.user.ownerId, isDeleted: false },
                    _count: true
                })
            ])

            const getStats = (groups: any[]) => {
                const synced = groups.find(g => g.syncedToQoyod === true)?._count || 0
                const notSynced = groups.find(g => g.syncedToQoyod === false)?._count || 0
                return { synced, total: synced + notSynced }
            }

            return NextResponse.json({
                invoices: getStats(invoiceStats),
                payments: getStats(paymentStats),
                customers: getStats(customerStats),
                autoSync: config.autoSync
            })
        }

        // Default: Test connection
        try {
            const data = await qoyodRequest('/products?limit=1', 'GET', null, config)
            return NextResponse.json({
                connected: true,
                message: 'تم الاتصال بقيود بنجاح',
                details: `عدد المنتجات: ${data.total || 0}`
            })
        } catch (e) {
            return NextResponse.json({
                connected: false,
                message: 'فشل الاتصال - مفتاح API غير صالح'
            })
        }
    } catch (error) {
        return NextResponse.json({
            connected: false,
            message: 'حدث خطأ في الاتصال بقيود'
        })
    }
}

// POST - Sync Action
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { type, id } = body // type: 'invoice' or 'payment'

        const config = await getQoyodConfig()
        if (!config) throw new Error('Qoyod not configured')

        // ====================================================
        // SYNC INVOICE
        // ====================================================
        if (type === 'invoice') {
            const invoice = await prisma.invoice.findUnique({
                where: { id },
                include: {
                    customer: true,
                    booking: { include: { hall: true } }
                }
            })

            if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

            // 1. Sync Customer
            const contactId = await syncCustomer(invoice.customerId, config)

            // 2. Get or create service product (required for line items)
            const serviceProductId = await getOrCreateServiceProduct(config)

            // 3. Get inventory ID (required for invoices)
            const inventoryId = await getInventoryId(config)

            // 4. Calculate Revenue - USE TOTAL AMOUNT (VAT already included in Hall System)
            // Our system includes VAT in the final amount, so we send VAT-inclusive prices
            const totalAmount = Number(invoice.totalAmount) // Use totalAmount, not subtotal
            const serviceRevenueRaw = Number(invoice.booking.serviceRevenue) || 0

            // Edge case: If services cost more than total (heavy discount), cap it
            let actualServiceRevenue = serviceRevenueRaw
            let hallRevenue = totalAmount - serviceRevenueRaw

            if (hallRevenue < 0) {
                hallRevenue = 0
                actualServiceRevenue = totalAmount
            }

            // 5. Build Line Items (using product_id, required by Qoyod)
            // NOTE: We set tax_percent: 0 because VAT is already included in our amounts
            const lineItems = []

            // Hall Rental Line Item (if there's hall revenue)
            if (hallRevenue > 0) {
                lineItems.push({
                    product_id: serviceProductId,
                    description: `تأجير قاعة: ${invoice.booking.hall.nameAr} (${invoice.booking.bookingNumber})`,
                    quantity: 1,
                    unit_price: hallRevenue,
                    tax_percent: 0 // VAT already included
                })
            }

            // Services Line Item (if there's service revenue)
            if (actualServiceRevenue > 0) {
                lineItems.push({
                    product_id: serviceProductId,
                    description: `خدمات إضافية: صبابين، ذبائح، كراتين ماء (${invoice.booking.bookingNumber})`,
                    quantity: 1,
                    unit_price: actualServiceRevenue,
                    tax_percent: 0 // VAT already included
                })
            }

            // Fallback: If no line items (shouldn't happen), add the total
            if (lineItems.length === 0) {
                lineItems.push({
                    product_id: serviceProductId,
                    description: `حجز قاعة: ${invoice.booking.hall.nameAr} (${invoice.booking.bookingNumber})`,
                    quantity: 1,
                    unit_price: totalAmount,
                    tax_percent: 0 // VAT already included
                })
            }

            // 6. Create Invoice in Qoyod (with required inventory_id)
            // Status set to 'Draft' to allow deletion if needed before approval
            const invoicePayload = {
                invoice: {
                    contact_id: contactId,
                    issue_date: invoice.issueDate.toISOString().split('T')[0],
                    due_date: invoice.dueDate.toISOString().split('T')[0],
                    reference: invoice.invoiceNumber,
                    status: 'Draft',
                    inventory_id: inventoryId,
                    line_items: lineItems
                }
            }

            const qoyodRes = await qoyodRequest('/invoices', 'POST', invoicePayload, config)
            const qoyodInvoiceId = qoyodRes.invoice.id

            // 6. Update Local DB
            await prisma.invoice.update({
                where: { id },
                data: {
                    syncedToQoyod: true,
                    lastSyncAt: new Date(),
                    qoyodInvoiceId: qoyodInvoiceId.toString(),
                }
            })

            // Log Success
            await prisma.accountingSync.create({
                data: {
                    syncType: 'CREATE',
                    recordType: 'Invoice',
                    recordId: id,
                    status: 'SUCCESS',
                    qoyodId: qoyodInvoiceId.toString(),
                    requestData: JSON.stringify(invoicePayload),
                    responseData: JSON.stringify(qoyodRes),
                    completedAt: new Date()
                }
            })

            return NextResponse.json({ success: true, qoyodInvoiceId })
        }

        // ====================================================
        // SYNC PAYMENT
        // ====================================================
        if (type === 'payment') {
            const payment = await prisma.payment.findUnique({
                where: { id },
                include: {
                    booking: { include: { customer: true } },
                    invoice: true
                }
            })

            if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
            if (!payment.invoice || !payment.invoice.qoyodInvoiceId) {
                return NextResponse.json({ error: 'Invoice must be synced to Qoyod first' }, { status: 400 })
            }

            // Create Payment in Qoyod
            // V2 usually uses /invoice_payments with invoice_id

            const paymentPayload = {
                invoice_payment: {
                    invoice_id: payment.invoice.qoyodInvoiceId,
                    reference: payment.paymentNumber,
                    amount: Number(payment.amount),
                    date: payment.paymentDate.toISOString().split('T')[0],
                    account_id: await getBankAccountId(config)
                }
            }

            const qoyodRes = await qoyodRequest('/invoice_payments', 'POST', paymentPayload, config)
            const qoyodPaymentId = qoyodRes.invoice_payment.id

            await prisma.payment.update({
                where: { id },
                data: {
                    syncedToQoyod: true,
                    lastSyncAt: new Date(),
                    qoyodPaymentId: qoyodPaymentId.toString()
                }
            })

            // Log Success
            await prisma.accountingSync.create({
                data: {
                    syncType: 'CREATE',
                    recordType: 'Payment',
                    recordId: id,
                    status: 'SUCCESS',
                    qoyodId: qoyodPaymentId.toString(),
                    requestData: JSON.stringify(paymentPayload),
                    responseData: JSON.stringify(qoyodRes),
                    completedAt: new Date()
                }
            })

            return NextResponse.json({ success: true, qoyodPaymentId })
        }

        // ====================================================
        // DEACTIVATE INVOICE (Set to Draft in Qoyod)
        // ====================================================
        if (type === 'deactivate-invoice') {
            const invoice = await prisma.invoice.findUnique({
                where: { id }
            })

            if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
            if (!invoice.qoyodInvoiceId) {
                return NextResponse.json({ error: 'Invoice not synced to Qoyod' }, { status: 400 })
            }

            // Update invoice status to Draft in Qoyod
            const updatePayload = {
                invoice: {
                    status: 'Draft'
                }
            }

            await qoyodRequest(`/invoices/${invoice.qoyodInvoiceId}`, 'PUT', updatePayload, config)

            // Log Success
            await prisma.accountingSync.create({
                data: {
                    syncType: 'UPDATE',
                    recordType: 'Invoice',
                    recordId: id,
                    status: 'SUCCESS',
                    qoyodId: invoice.qoyodInvoiceId,
                    requestData: JSON.stringify(updatePayload),
                    responseData: JSON.stringify({ status: 'Draft' }),
                    completedAt: new Date()
                }
            })

            return NextResponse.json({ success: true, message: 'Invoice deactivated in Qoyod' })
        }

        // ====================================================
        // CANCEL INVOICE (Create Credit Note in Qoyod)
        // ====================================================
        if (type === 'cancel-invoice') {
            const invoice = await prisma.invoice.findUnique({
                where: { id },
                include: {
                    customer: true,
                    booking: { include: { hall: true } }
                }
            })

            if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
            if (!invoice.qoyodInvoiceId) {
                return NextResponse.json({ error: 'Invoice not synced to Qoyod' }, { status: 400 })
            }

            // Check if invoice has payments
            if (Number(invoice.paidAmount) > 0) {
                return NextResponse.json({
                    error: 'لا يمكن إلغاء فاتورة بها مدفوعات. يجب حذف المدفوعات أولاً.'
                }, { status: 400 })
            }

            // Get required IDs for credit note line items
            const serviceProductId = await getOrCreateServiceProduct(config)
            const inventoryId = await getInventoryId(config)

            // Create credit note in Qoyod to cancel the invoice
            const creditNotePayload = {
                credit_note: {
                    contact_id: invoice.customer.qoyodCustomerId,
                    invoice_id: invoice.qoyodInvoiceId,
                    issue_date: new Date().toISOString().split('T')[0],
                    reference: `CN-${invoice.invoiceNumber}`,
                    notes: `إلغاء الفاتورة ${invoice.invoiceNumber}`,
                    status: 'Draft',
                    inventory_id: inventoryId,
                    line_items: [
                        {
                            product_id: serviceProductId,
                            description: `إلغاء فاتورة: ${invoice.invoiceNumber} - ${invoice.booking.hall.nameAr}`,
                            quantity: 1,
                            unit_price: Number(invoice.totalAmount),
                            tax_percent: 0 // VAT already included in our amounts
                        }
                    ]
                }
            }

            const qoyodRes = await qoyodRequest('/credit_notes', 'POST', creditNotePayload, config)
            const qoyodCreditNoteId = qoyodRes.credit_note?.id

            // Update local invoice status to CANCELLED
            await prisma.invoice.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    notes: `${invoice.notes || ''}\nإشعار دائن: ${qoyodCreditNoteId || 'N/A'}`
                }
            })

            // Log Success
            await prisma.accountingSync.create({
                data: {
                    syncType: 'CREATE',
                    recordType: 'CreditNote',
                    recordId: id,
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
                message: 'تم إلغاء الفاتورة وإنشاء إشعار دائن بنجاح'
            })
        }

        // ====================================================
        // DELETE INVOICE FROM QOYOD (Only works for Draft invoices)
        // ====================================================
        if (type === 'delete-invoice') {
            const invoice = await prisma.invoice.findUnique({
                where: { id }
            })

            if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
            if (!invoice.qoyodInvoiceId) {
                return NextResponse.json({ error: 'Invoice not synced to Qoyod' }, { status: 400 })
            }

            // Delete the invoice from Qoyod (only works for Draft status)
            await qoyodRequest(`/invoices/${invoice.qoyodInvoiceId}`, 'DELETE', null, config)

            // Update local database - clear Qoyod reference
            await prisma.invoice.update({
                where: { id },
                data: {
                    syncedToQoyod: false,
                    qoyodInvoiceId: null,
                    lastSyncAt: new Date()
                }
            })

            // Log Success
            await prisma.accountingSync.create({
                data: {
                    syncType: 'DELETE',
                    recordType: 'Invoice',
                    recordId: id,
                    status: 'SUCCESS',
                    qoyodId: invoice.qoyodInvoiceId,
                    requestData: JSON.stringify({ action: 'delete', invoiceId: invoice.qoyodInvoiceId }),
                    responseData: JSON.stringify({ deleted: true }),
                    completedAt: new Date()
                }
            })

            return NextResponse.json({ success: true, message: 'تم حذف الفاتورة من قيود بنجاح' })
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

    } catch (error: any) {
        console.error('Qoyod Sync Error:', error)

        // Try to log failure if we have a record context (id/type)
        // Since we are in generic catch, might be hard, but usually helpful to log
        // For now just console log

        return NextResponse.json(
            { error: error.message || 'Failed to sync with Qoyod' },
            { status: 500 }
        )
    }
}
