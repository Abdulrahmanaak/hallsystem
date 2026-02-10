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
async function qoyodRequest(endpoint: string, method: string = 'GET', body: unknown = null, config: QoyodConfig) {
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
            // Use warn instead of error for 404s (often expected during searches)
            if (response.status === 404) {
                console.warn(`Qoyod API [${method} ${url}]: 404 - ${errorText}`)
            } else {
                console.error(`Qoyod API Error [${method} ${url}]:`, response.status, errorText)
            }
            throw new Error(`Qoyod API Error: ${response.status} - ${errorText}`)
        }

        // Get response text first (can only read body once)
        const responseText = await response.text()

        // Handle empty responses (some DELETE endpoints return empty body)
        if (!responseText || responseText.trim() === '') {
            console.log(`Qoyod API [${method} ${url}]: Success (empty response)`)
            return { success: true, message: 'Success' }
        }

        // Try to parse as JSON, fall back to text wrapper
        try {
            return JSON.parse(responseText)
        } catch {
            // Not valid JSON - return as text wrapper
            console.log(`Qoyod API [${method} ${url}]: Text response - "${responseText}"`)
            return { success: true, message: responseText }
        }
    } catch (error: unknown) {
        // Only log as error if it's not an expected 404
        const errMsg = error instanceof Error ? error.message : String(error)
        if (!errMsg.includes('404')) {
            console.error('Qoyod Request Failed:', errMsg)
        }
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const salesAcc = res.accounts.find((a: Record<string, any>) => a.name_en?.toLowerCase().includes('sales') || a.name_ar?.includes('مبيعات'))
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bankAcc = res.accounts.find((a: Record<string, any>) =>
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const unit = res.product_unit_types.find((u: Record<string, any>) =>
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
    } catch (e: unknown) {
        const eMsg = e instanceof Error ? e.message : String(e)
        if (eMsg.includes('404') || eMsg.includes('nothing')) {
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
    } catch (e: unknown) {
        // If 404 or empty result, proceed to create
        const eMsg = e instanceof Error ? e.message : String(e)
        if (eMsg.includes('404')) {
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
            } catch (e: unknown) {
                return NextResponse.json({
                    success: false,
                    error: e instanceof Error ? e.message : 'Failed to fetch accounts'
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

            const getStats = (groups: { syncedToQoyod: boolean; _count: number }[]) => {
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

        // Action: Verify and fix sync status for all invoices
        if (action === 'verify-sync') {
            const session = await auth()
            if (!session?.user?.ownerId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            // Get all invoices marked as synced
            const syncedInvoices = await prisma.invoice.findMany({
                where: {
                    ownerId: session.user.ownerId,
                    syncedToQoyod: true,
                    isDeleted: false
                },
                select: {
                    id: true,
                    invoiceNumber: true,
                    qoyodInvoiceId: true
                }
            })

            // Fetch all invoices from Qoyod
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let qoyodInvoices: Record<string, any>[] = []
            try {
                // Try fetching all invoices - Qoyod v2 API
                const res = await qoyodRequest('/invoices', 'GET', null, config)
                console.log('Qoyod invoices response:', JSON.stringify(res).substring(0, 500))
                qoyodInvoices = res.invoices || []
                console.log(`Found ${qoyodInvoices.length} invoices in Qoyod`)
            } catch (e: unknown) {
                const eMsg = e instanceof Error ? e.message : String(e)
                console.error('Failed to fetch invoices from Qoyod:', eMsg)
                // If error contains "nothing", it means no invoices exist
                if (eMsg.includes('nothing') || eMsg.includes('404')) {
                    console.log('No invoices found in Qoyod')
                    qoyodInvoices = []
                } else {
                    return NextResponse.json({
                        error: 'فشل في جلب الفواتير من قيود: ' + eMsg
                    }, { status: 500 })
                }
            }

            // Create a map of Qoyod invoices by reference number
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const qoyodByReference = new Map<string, Record<string, any>>()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const qoyodById = new Map<string, Record<string, any>>()
            for (const inv of qoyodInvoices) {
                if (inv.reference) {
                    qoyodByReference.set(inv.reference, inv)
                }
                qoyodById.set(inv.id.toString(), inv)
            }

            // Check each synced invoice
            const results = {
                verified: 0,      // Exists in Qoyod
                fixed: 0,         // ID corrected
                notFound: 0,      // Not in Qoyod, status updated
                errors: 0
            }
            const notFoundInvoices: string[] = []

            for (const invoice of syncedInvoices) {
                try {
                    // First check by reference number
                    const qoyodInv = qoyodByReference.get(invoice.invoiceNumber)

                    if (qoyodInv) {
                        // Found in Qoyod - verify/fix ID
                        const correctId = qoyodInv.id.toString()
                        if (invoice.qoyodInvoiceId !== correctId) {
                            // Fix the ID
                            await prisma.invoice.update({
                                where: { id: invoice.id },
                                data: { qoyodInvoiceId: correctId }
                            })
                            results.fixed++
                            console.log(`Fixed ${invoice.invoiceNumber}: ${invoice.qoyodInvoiceId} -> ${correctId}`)
                        } else {
                            results.verified++
                        }
                    } else if (invoice.qoyodInvoiceId && qoyodById.has(invoice.qoyodInvoiceId)) {
                        // Found by stored ID (reference might be different)
                        results.verified++
                    } else {
                        // Not found in Qoyod - mark as not synced
                        await prisma.invoice.update({
                            where: { id: invoice.id },
                            data: {
                                syncedToQoyod: false,
                                qoyodInvoiceId: null
                            }
                        })
                        results.notFound++
                        notFoundInvoices.push(invoice.invoiceNumber)
                        console.log(`Invoice ${invoice.invoiceNumber} not found in Qoyod, unmarked sync`)
                    }
                } catch (e) {
                    console.error(`Error verifying invoice ${invoice.invoiceNumber}:`, e)
                    results.errors++
                }
            }

            return NextResponse.json({
                success: true,
                message: `تم التحقق من ${syncedInvoices.length} فاتورة`,
                results,
                notFoundInvoices,
                qoyodInvoiceCount: qoyodInvoices.length
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

import { enforceSubscription } from '@/lib/subscription'

// POST - Sync Action
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check Subscription
        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

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

            // Step 0: Check if invoice already exists in Qoyod by reference number
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let existingQoyodInvoice: Record<string, any> | null = null
            try {
                const searchRes = await qoyodRequest(
                    `/invoices?q[reference_eq]=${encodeURIComponent(invoice.invoiceNumber)}`,
                    'GET', null, config
                )
                if (searchRes.invoices?.length > 0) {
                    existingQoyodInvoice = searchRes.invoices[0]
                    console.log(`Invoice ${invoice.invoiceNumber} already exists in Qoyod with ID ${existingQoyodInvoice!.id}`)
                }
            } catch (e: unknown) {
                // Ignore search errors (404 means not found, which is fine)
                const eMsg = e instanceof Error ? e.message : String(e)
                if (!eMsg.includes('404') && !eMsg.includes('nothing')) {
                    console.warn('Error searching for existing invoice:', eMsg)
                }
            }

            // If invoice already exists in Qoyod, just update local record
            if (existingQoyodInvoice) {
                const existingId = existingQoyodInvoice.id.toString()
                await prisma.invoice.update({
                    where: { id },
                    data: {
                        syncedToQoyod: true,
                        qoyodInvoiceId: existingId,
                        lastSyncAt: new Date()
                    }
                })

                // Log the sync recovery
                await prisma.accountingSync.create({
                    data: {
                        syncType: 'LINK',
                        recordType: 'Invoice',
                        recordId: id,
                        status: 'SUCCESS',
                        qoyodId: existingId,
                        requestData: JSON.stringify({ action: 'link-existing', invoiceNumber: invoice.invoiceNumber }),
                        responseData: JSON.stringify({ existingInvoice: existingQoyodInvoice }),
                        completedAt: new Date()
                    }
                })

                return NextResponse.json({
                    success: true,
                    qoyodInvoiceId: existingId,
                    message: 'الفاتورة موجودة في قيود. تم تحديث الربط.',
                    alreadyExisted: true
                })
            }

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

            let qoyodInvoiceId: string
            try {
                const qoyodRes = await qoyodRequest('/invoices', 'POST', invoicePayload, config)
                qoyodInvoiceId = qoyodRes.invoice.id.toString()

                // Log Success
                await prisma.accountingSync.create({
                    data: {
                        syncType: 'CREATE',
                        recordType: 'Invoice',
                        recordId: id,
                        status: 'SUCCESS',
                        qoyodId: qoyodInvoiceId,
                        requestData: JSON.stringify(invoicePayload),
                        responseData: JSON.stringify(qoyodRes),
                        completedAt: new Date()
                    }
                })
            } catch (error: unknown) {
                // Handle "Reference is already taken by id XXXX" error (422)
                const errorMsg = error instanceof Error ? error.message : String(error)
                const match = errorMsg.match(/Reference is already taken by id (\d+)/)
                if (match) {
                    const existingId = match[1]
                    console.log(`Invoice reference already exists in Qoyod with ID ${existingId}, updating local record`)

                    await prisma.invoice.update({
                        where: { id },
                        data: {
                            syncedToQoyod: true,
                            qoyodInvoiceId: existingId,
                            lastSyncAt: new Date()
                        }
                    })

                    await prisma.accountingSync.create({
                        data: {
                            syncType: 'LINK',
                            recordType: 'Invoice',
                            recordId: id,
                            status: 'SUCCESS',
                            qoyodId: existingId,
                            requestData: JSON.stringify({ action: 'recovered-from-duplicate', invoiceNumber: invoice.invoiceNumber }),
                            responseData: JSON.stringify({ recoveredId: existingId }),
                            completedAt: new Date()
                        }
                    })

                    return NextResponse.json({
                        success: true,
                        qoyodInvoiceId: existingId,
                        message: 'الفاتورة موجودة في قيود. تم تحديث الربط.',
                        recoveredFromDuplicate: true
                    })
                }

                // Re-throw other errors with friendly messages
                if (errorMsg.includes('403')) {
                    throw new Error('غير مصرح. تحقق من صلاحيات مفتاح API.')
                }
                throw error
            }

            // 7. Update Local DB
            await prisma.invoice.update({
                where: { id },
                data: {
                    syncedToQoyod: true,
                    lastSyncAt: new Date(),
                    qoyodInvoiceId: qoyodInvoiceId,
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
            if (!invoice.syncedToQoyod) {
                return NextResponse.json({ error: 'Invoice not synced to Qoyod' }, { status: 400 })
            }

            // Step 1: Find the invoice in Qoyod by reference number (our invoice number)
            // This ensures we get the correct Qoyod ID even if our stored ID is wrong
            let actualQoyodId: string | null = invoice.qoyodInvoiceId
            let foundInQoyod = false

            try {
                // Search for invoice by reference number in Qoyod
                const searchRes = await qoyodRequest(
                    `/invoices?q[reference_eq]=${encodeURIComponent(invoice.invoiceNumber)}`,
                    'GET',
                    null,
                    config
                )

                if (searchRes.invoices && searchRes.invoices.length > 0) {
                    // Found the invoice - use the actual Qoyod ID
                    actualQoyodId = searchRes.invoices[0].id.toString()
                    foundInQoyod = true
                    console.log(`Found invoice in Qoyod: reference=${invoice.invoiceNumber}, qoyodId=${actualQoyodId}`)

                    // Update local record with correct ID if different
                    if (actualQoyodId !== invoice.qoyodInvoiceId) {
                        console.log(`Correcting qoyodInvoiceId: ${invoice.qoyodInvoiceId} -> ${actualQoyodId}`)
                        await prisma.invoice.update({
                            where: { id },
                            data: { qoyodInvoiceId: actualQoyodId }
                        })
                    }
                } else {
                    console.log(`Invoice ${invoice.invoiceNumber} not found in Qoyod by reference (empty results)`)
                    // Invoice doesn't exist in Qoyod - clear the incorrect stored ID
                    actualQoyodId = null
                }
            } catch (e: unknown) {
                // Handle 404 / "nothing found" as empty results - invoice doesn't exist in Qoyod
                const eMsg = e instanceof Error ? e.message : String(e)
                if (eMsg.includes('404') || eMsg.includes('nothing')) {
                    console.log(`Invoice ${invoice.invoiceNumber} not found in Qoyod (404/nothing): ${eMsg}`)
                    actualQoyodId = null
                } else {
                    console.warn('Failed to search for invoice in Qoyod, will try with stored ID:', eMsg)
                }
            }

            // Step 2: Delete the invoice from Qoyod
            let qoyodDeleted = false
            let notFoundOnQoyod = false
            let errorMessage: string | null = null

            if (actualQoyodId) {
                try {
                    await qoyodRequest(`/invoices/${actualQoyodId}`, 'DELETE', null, config)
                    qoyodDeleted = true
                    console.log(`Successfully deleted invoice ${actualQoyodId} from Qoyod`)
                } catch (error: unknown) {
                    // Check if it's a 404 (not found) error
                    const errMsg = error instanceof Error ? error.message : String(error)
                    if (errMsg.includes('404') || errMsg.includes('Invalid invoice ID')) {
                        console.log(`Invoice ${actualQoyodId} not found on Qoyod`)
                        notFoundOnQoyod = true
                    } else if (errMsg.includes('403') || errMsg.includes('approved') || errMsg.includes('ZATCA')) {
                        // Invoice is approved and cannot be deleted
                        errorMessage = 'لا يمكن حذف فاتورة معتمدة. استخدم خيار "إلغاء الفاتورة" لإنشاء إشعار دائن.'
                        throw new Error(errorMessage)
                    } else {
                        throw error
                    }
                }
            } else {
                notFoundOnQoyod = true
            }

            // Step 3: Update local database - clear Qoyod reference
            await prisma.invoice.update({
                where: { id },
                data: {
                    syncedToQoyod: false,
                    qoyodInvoiceId: null,
                    lastSyncAt: new Date()
                }
            })

            // Log the operation
            await prisma.accountingSync.create({
                data: {
                    syncType: 'DELETE',
                    recordType: 'Invoice',
                    recordId: id,
                    status: qoyodDeleted ? 'SUCCESS' : 'PARTIAL',
                    qoyodId: actualQoyodId,
                    requestData: JSON.stringify({
                        action: 'delete',
                        invoiceNumber: invoice.invoiceNumber,
                        storedQoyodId: invoice.qoyodInvoiceId,
                        actualQoyodId
                    }),
                    responseData: JSON.stringify({
                        deleted: qoyodDeleted,
                        foundInQoyod,
                        notFoundOnQoyod,
                        localCleanup: true
                    }),
                    completedAt: new Date()
                }
            })

            // Return appropriate message
            let message: string
            if (qoyodDeleted) {
                message = 'تم حذف الفاتورة من قيود بنجاح'
            } else if (notFoundOnQoyod) {
                message = 'الفاتورة غير موجودة في قيود. تم تنظيف الربط المحلي.'
            } else {
                message = 'تم تنظيف الربط المحلي'
            }

            return NextResponse.json({ success: true, message, deleted: qoyodDeleted })
        }


        // ====================================================
        // SYNC EXPENSE
        // ====================================================
        if (type === 'expense') {
            const expense = await prisma.expense.findUnique({
                where: { id },
                include: { vendor: true }
            })

            if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

            // Get IDs
            const accountId = config.defaultBankAccountId // Paying from this account
            const categoryId = 1 // Default category ID or map from expense.category? Qoyod usually requires integer ID. 
            // For now, allow Qoyod to assign default or use a known one if possible.
            // Or better, don't send category_id and let Qoyod use default 'Uncategorized' or similar.

            // Prepare payload
            // Note: Qoyod /expenses endpoint struct might vary. Assuming similar to /invoices but simpler.
            // If we have a vendor with qoyodVendorId, use it.

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: Record<string, Record<string, any>> = {
                expense: {
                    reference: expense.description.substring(0, 50),
                    issue_date: expense.expenseDate.toISOString().split('T')[0],
                    amount: Number(expense.amount),
                    description: expense.description,
                    paid_through_account_id: accountId, // Required: Account ID where money came from
                    tax_inclusive: true, // Assuming amounts entered are tax inclusive
                }
            }

            if (expense.vendor?.qoyodVendorId) {
                payload.expense.contact_id = expense.vendor.qoyodVendorId
            }

            // If already synced, update? Qoyod expenses usually editable.
            // But usually we just create.
            if (expense.qoyodExpenseId) {
                // Update
                await qoyodRequest(`/expenses/${expense.qoyodExpenseId}`, 'PUT', payload, config)
                await prisma.accountingSync.create({
                    data: {
                        syncType: 'UPDATE',
                        recordType: 'Expense',
                        recordId: id,
                        status: 'SUCCESS',
                        qoyodId: expense.qoyodExpenseId,
                        requestData: JSON.stringify(payload),
                        responseData: JSON.stringify({ updated: true }),
                        completedAt: new Date()
                    }
                })
                return NextResponse.json({ success: true, message: 'تم تحديث المصروف في قيود' })
            } else {
                // Create
                const qoyodRes = await qoyodRequest('/expenses', 'POST', payload, config)
                const qoyodExpenseId = qoyodRes.expense?.id

                if (qoyodExpenseId) {
                    await prisma.expense.update({
                        where: { id },
                        data: {
                            syncedToQoyod: true,
                            qoyodExpenseId: qoyodExpenseId.toString(),
                            lastSyncAt: new Date()
                        }
                    })

                    await prisma.accountingSync.create({
                        data: {
                            syncType: 'CREATE',
                            recordType: 'Expense',
                            recordId: id,
                            status: 'SUCCESS',
                            qoyodId: qoyodExpenseId.toString(),
                            requestData: JSON.stringify(payload),
                            responseData: JSON.stringify(qoyodRes),
                            completedAt: new Date()
                        }
                    })

                    return NextResponse.json({ success: true, message: 'تم إضافة المصروف إلى قيود' })
                } else {
                    throw new Error('Failed to get ID from Qoyod response')
                }
            }
        }

        // ====================================================
        // DELETE EXPENSE
        // ====================================================
        if (type === 'delete-expense') {
            const expense = await prisma.expense.findUnique({
                where: { id }
            })

            if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

            // 1. Delete from Qoyod if synced
            let qoyodDeleted = false
            if (expense.syncedToQoyod && expense.qoyodExpenseId) {
                try {
                    await qoyodRequest(`/expenses/${expense.qoyodExpenseId}`, 'DELETE', null, config)
                    qoyodDeleted = true
                } catch (error) {
                    console.error('Error deleting expense from Qoyod:', error)
                    // We continue to soft-delete locally even if Qoyod fails (or if already deleted)
                }
            }

            // 2. Soft delete locally
            await prisma.expense.update({
                where: { id },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    syncedToQoyod: false, // Unlink
                    qoyodExpenseId: null
                }
            })

            // Log Success
            await prisma.accountingSync.create({
                data: {
                    syncType: 'DELETE',
                    recordType: 'Expense',
                    recordId: id,
                    status: 'SUCCESS',
                    qoyodId: expense.qoyodExpenseId,
                    requestData: JSON.stringify({ action: 'delete', expenseId: expense.qoyodExpenseId }),
                    responseData: JSON.stringify({ deleted: qoyodDeleted, localSoftDelete: true }),
                    completedAt: new Date()
                }
            })

            return NextResponse.json({ success: true, message: 'تم حذف المصروف بنجاح' })
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

    } catch (error: unknown) {
        console.error('Qoyod Sync Error:', error)

        // Try to log failure if we have a record context (id/type)
        // Since we are in generic catch, might be hard, but usually helpful to log
        // For now just console log

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to sync with Qoyod' },
            { status: 500 }
        )
    }
}
