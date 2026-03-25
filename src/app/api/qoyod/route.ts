import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { enforceSubscription } from '@/lib/subscription'
import { qoyodSyncSchema, validateBody } from '@/lib/validations'
import { createTenantLogger } from '@/lib/logger'

const log = createTenantLogger({ module: 'qoyod-sync' })

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
            let parsedError = null
            try { parsedError = JSON.parse(errorText) } catch (e) { /* ignore */ }

            if (response.status === 404) {
                console.warn(`Qoyod API [${method} ${url}]: 404 - ${errorText}`)
            } else {
                console.error(`Qoyod API Error [${method} ${url}]:`, response.status)
                console.error('Error Details:', JSON.stringify(parsedError || errorText, null, 2))
                console.error('Payload sent:', JSON.stringify(body, null, 2))
            }
            // Include parsed error in the message if possible
            const detailedMsg = parsedError ? JSON.stringify(parsedError) : errorText
            throw new Error(`Qoyod API Error: ${response.status} - ${detailedMsg}`)
        }

        // Get response text first (can only read body once)
        const responseText = await response.text()

        // Handle empty responses (some DELETE endpoints return empty body)
        if (!responseText || responseText.trim() === '') {
            return { success: true, message: 'Success' }
        }

        // Try to parse as JSON, fall back to text wrapper
        try {
            return JSON.parse(responseText)
        } catch {
            // Not valid JSON - return as text wrapper
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

// 2.4 Helper: Resilient Account Fetcher
async function fetchAccounts(config: QoyodConfig, query?: string): Promise<any[]> {
    try {
        const endpoint = query ? `/accounts?${query}` : '/accounts'
        const res = await qoyodRequest(endpoint, 'GET', null, config)
        return res.accounts || []
    } catch (e) {
        // If 404 "nothing found", return empty array instead of throwing
        if (e instanceof Error && e.message.includes('404')) {
            return []
        }
        throw e
    }
}
// 2.5 Helper: Get Sales Account ID
async function getSalesAccountId(config: QoyodConfig, prefetchAccounts?: any[]): Promise<number> {
    if (config.defaultSalesAccountId) return parseInt(config.defaultSalesAccountId)

    const accounts = prefetchAccounts || await fetchAccounts(config)

    // Filter locally
    const salesAcc = accounts.find((a: any) =>
        (a.type?.includes('Revenue') || a.type_id === 5) &&
        (a.name_en?.toLowerCase().includes('sales') || a.name_ar?.includes('مبيعات'))
    )

    if (salesAcc) return salesAcc.id

    // Fallback: use first revenue account
    const anyRevenue = accounts.find((a: any) => a.type?.includes('Revenue') || a.type_id === 5)
    if (anyRevenue) return anyRevenue.id

    console.warn('No sales/revenue account found in Qoyod. Please configure qoyodDefaultSalesAccountId in settings.')
    return 17 // Last resort fallback
}

// 2.6 Helper: Get Bank/Cash Account ID for payments
async function getBankAccountId(config: QoyodConfig, prefetchAccounts?: any[]): Promise<number> {
    if (config.defaultBankAccountId) return parseInt(config.defaultBankAccountId)

    const accounts = prefetchAccounts || await fetchAccounts(config)
    
    // Prioritize Liquid Assets (Banks, Cash), strictly exclude Fixed Assets
    const liquidAcc = accounts.find((a: any) =>
        (a.type?.includes('Asset') || a.type_id === 1) && 
        !(a.name_ar?.includes('أراضي') || a.name_ar?.includes('مباني') || a.name_en?.toLowerCase().includes('land')) &&
        (a.name_en?.toLowerCase().includes('cash') || a.name_en?.toLowerCase().includes('bank') || a.name_ar?.includes('صندوق') || a.name_ar?.includes('بنك') || a.name_ar?.includes('نقدية'))
    )
    
    if (liquidAcc) return liquidAcc.id

    // Fallback to "Cash in Hand" ID 7 if found
    const cashInHand = accounts.find(a => a.id === 7 || a.name_ar?.includes('نقدية'))
    if (cashInHand) return cashInHand.id

    return 7 // General default
}

// 2.7 Helper: Get Expense Account ID
async function getExpenseAccountId(config: QoyodConfig, prefetchAccounts?: any[]): Promise<number> {
    const accounts = prefetchAccounts || await fetchAccounts(config)
    
    const expAcc = accounts.find((a: any) => 
        (a.type?.includes('Expense') || a.type_id === 4) && 
        (a.name_ar?.includes('عامة') || a.name_ar?.includes('أخرى') || a.name_ar?.includes('نثرية') || a.name_en?.toLowerCase().includes('general') || a.name_en?.toLowerCase().includes('other'))
    )

    if (expAcc) return expAcc.id
    
    const anyExp = accounts.find((a: any) => a.type?.includes('Expense') || a.type_id === 4)
    if (anyExp) return anyExp.id

    return 74 
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
                qoyodInvoices = res.invoices || []
            } catch (e: unknown) {
                const eMsg = e instanceof Error ? e.message : String(e)
                console.error('Failed to fetch invoices from Qoyod:', eMsg)
                // If error contains "nothing", it means no invoices exist
                if (eMsg.includes('nothing') || eMsg.includes('404')) {
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


// POST - Sync Action
export async function POST(request: Request) {
    const clonedReq = request.clone()
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check Subscription
        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const rawBody = await request.json()
        const validated = validateBody(qoyodSyncSchema, rawBody)
        if (!validated.success) {
            return NextResponse.json({ error: validated.error }, { status: 400 })
        }
        const body = validated.data
        const { type, id } = body

        const config = await getQoyodConfig()
        if (!config) throw new Error('Qoyod not configured')

        // Pre-fetch accounts once to avoid multiple network calls and slow logging
        const allAccounts = await fetchAccounts(config)

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

            // Already synced - return existing link
            if (invoice.syncedToQoyod && invoice.qoyodInvoiceId) {
                return NextResponse.json({
                    success: true,
                    qoyodInvoiceId: invoice.qoyodInvoiceId,
                    message: 'الفاتورة مرتبطة بقيود بالفعل',
                    alreadySynced: true
                })
            }

            // Check for in-progress sync to prevent concurrent sync attempts
            const pendingSync = await prisma.accountingSync.findFirst({
                where: {
                    recordId: id,
                    recordType: 'Invoice',
                    syncType: 'CREATE',
                    status: 'PENDING',
                    // Only consider syncs started in the last 2 minutes as "in progress"
                    createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) }
                }
            })

            if (pendingSync) {
                return NextResponse.json({
                    success: false,
                    message: 'مزامنة الفاتورة قيد التنفيذ بالفعل',
                    inProgress: true
                }, { status: 409 })
            }

            // Mark sync as in-progress
            const syncRecord = await prisma.accountingSync.create({
                data: {
                    syncType: 'CREATE',
                    recordType: 'Invoice',
                    recordId: id,
                    status: 'PENDING',
                    requestData: JSON.stringify({ invoiceNumber: invoice.invoiceNumber }),
                }
            })

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

                // Update sync record
                await prisma.accountingSync.update({
                    where: { id: syncRecord.id },
                    data: {
                        syncType: 'LINK',
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
            const totalAmount = Number(invoice.totalAmount)
            const settings = await prisma.settings.findUnique({
                where: { ownerId: session.user.ownerId }
            })
            const vatPercentage = Number(settings?.vatPercentage) || 15
            
            const serviceRevenueRaw = Number(invoice.booking.serviceRevenue) || 0

            // Edge case: If services cost more than total (heavy discount), cap it
            let actualServiceRevenue = serviceRevenueRaw
            let hallRevenue = totalAmount - serviceRevenueRaw

            if (hallRevenue < 0) {
                hallRevenue = 0
                actualServiceRevenue = totalAmount
            }

            // 5. Build Line Items (using product_id, required by Qoyod)
            // NOTE: We set tax_percent to the actual rate and tax_inclusive in the payload
            const lineItems = []

            // Hall Rental Line Item (if there's hall revenue)
            if (hallRevenue > 0) {
                lineItems.push({
                    product_id: serviceProductId,
                    description: `تأجير قاعة: ${invoice.booking.hall.nameAr} (${invoice.booking.bookingNumber})`,
                    quantity: 1,
                    unit_price: hallRevenue,
                    tax_percent: vatPercentage
                })
            }

            // Services Line Item (if there's service revenue)
            if (actualServiceRevenue > 0) {
                lineItems.push({
                    product_id: serviceProductId,
                    description: `خدمات إضافية: صبابين، ذبائح، كراتين ماء (${invoice.booking.bookingNumber})`,
                    quantity: 1,
                    unit_price: actualServiceRevenue,
                    tax_percent: vatPercentage
                })
            }

            // Fallback: If no line items (shouldn't happen), add the total
            if (lineItems.length === 0) {
                lineItems.push({
                    product_id: serviceProductId,
                    description: `حجز قاعة: ${invoice.booking.hall.nameAr} (${invoice.booking.bookingNumber})`,
                    quantity: 1,
                    unit_price: totalAmount,
                    tax_percent: vatPercentage
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
                    tax_inclusive: true,
                    line_items: lineItems
                }
            }

            let qoyodInvoiceId: string
            try {
                const qoyodRes = await qoyodRequest('/invoices', 'POST', invoicePayload, config)
                qoyodInvoiceId = qoyodRes.invoice.id.toString()

                // Update sync record to SUCCESS
                await prisma.accountingSync.update({
                    where: { id: syncRecord.id },
                    data: {
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

                    await prisma.invoice.update({
                        where: { id },
                        data: {
                            syncedToQoyod: true,
                            qoyodInvoiceId: existingId,
                            lastSyncAt: new Date()
                        }
                    })

                    await prisma.accountingSync.update({
                        where: { id: syncRecord.id },
                        data: {
                            syncType: 'LINK',
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
                    account_id: await getBankAccountId(config, allAccounts)
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

            // Get VAT percentage to match original invoice tax treatment
            const settings = await prisma.settings.findUnique({
                where: { ownerId: session.user.ownerId }
            })
            const vatPercentage = Number(settings?.vatPercentage) || 15

            // Create credit note in Qoyod to cancel the invoice
            // Credit note must mirror the original invoice's tax treatment
            const creditNotePayload = {
                credit_note: {
                    contact_id: invoice.customer.qoyodCustomerId,
                    invoice_id: invoice.qoyodInvoiceId,
                    issue_date: new Date().toISOString().split('T')[0],
                    reference: `CN-${invoice.invoiceNumber}`,
                    notes: `إلغاء الفاتورة ${invoice.invoiceNumber}`,
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
            } catch (cnError) {
                // Log failed attempt - do NOT update invoice status since Qoyod failed
                await prisma.accountingSync.create({
                    data: {
                        syncType: 'CREATE',
                        recordType: 'CreditNote',
                        recordId: id,
                        status: 'FAILED',
                        errorMessage: cnError instanceof Error ? cnError.message : String(cnError),
                        requestData: JSON.stringify(creditNotePayload),
                        completedAt: new Date()
                    }
                })
                throw cnError
            }

            // Only update local invoice status AFTER Qoyod confirms credit note creation
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
                    qoyodId: qoyodCreditNoteId || null,
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

                    // Update local record with correct ID if different
                    if (actualQoyodId !== invoice.qoyodInvoiceId) {
                        await prisma.invoice.update({
                            where: { id },
                            data: { qoyodInvoiceId: actualQoyodId }
                        })
                    }
                } else {
                    // Invoice doesn't exist in Qoyod - clear the incorrect stored ID
                    actualQoyodId = null
                }
            } catch (e: unknown) {
                // Handle 404 / "nothing found" as empty results - invoice doesn't exist in Qoyod
                const eMsg = e instanceof Error ? e.message : String(e)
                if (eMsg.includes('404') || eMsg.includes('nothing')) {
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
                } catch (error: unknown) {
                    // Check if it's a 404 (not found) error
                    const errMsg = error instanceof Error ? error.message : String(error)
                    if (errMsg.includes('404') || errMsg.includes('Invalid invoice ID')) {
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
        // SYNC EXPENSE (Migration to V2 Bills)
        // ====================================================
        if (type === 'expense') {
            const expense = await prisma.expense.findUnique({
                where: { id },
                include: { vendor: true }
            })

            if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

            // 1. Get Accounts & Inventory
            const paidThroughAccountId = await getBankAccountId(config, allAccounts)
            // Get expense product - try to find it dynamically instead of hardcoding
            let productId: number
            try {
                const prodRes = await qoyodRequest('/products?q[sku_eq]=EXPENSE-001', 'GET', null, config)
                if (prodRes.products?.length > 0) {
                    productId = prodRes.products[0].id
                } else {
                    // Fallback: search for petty cash product by name
                    const prodRes2 = await qoyodRequest('/products', 'GET', null, config)
                    const expProd = prodRes2.products?.find((p: any) =>
                        p.name_ar?.includes('نثريات') || p.name_ar?.includes('مصروفات') || p.purchase_item === true
                    )
                    productId = expProd?.id || 30 // Last resort fallback
                }
            } catch {
                productId = 30 // Fallback if product search fails
            }
            const inventoryId = await getInventoryId(config)

            const settings = await prisma.settings.findUnique({
                where: { ownerId: session.user.ownerId }
            })
            const vatPercentage = Number(settings?.vatPercentage) || 15

            // 2. Build Bill Payload (Purchases -> Bills)
            const billPayload = {
                bill: {
                    contact_id: expense.vendor?.qoyodVendorId ? Number(expense.vendor.qoyodVendorId) : undefined,
                    status: 'Draft',
                    issue_date: expense.expenseDate.toISOString().split('T')[0],
                    due_date: expense.expenseDate.toISOString().split('T')[0],
                    inventory_id: inventoryId,
                    line_items: [
                        {
                            product_id: productId,
                            description: expense.description,
                            quantity: 1,
                            unit_price: Number(expense.amount),
                            tax_id: (vatPercentage >= 14 && vatPercentage <= 16) ? 1 : undefined,
                            tax_percent: vatPercentage,
                            is_inclusive: true
                        }
                    ]
                }
            }

            console.log('Qoyod Bill Payload:', JSON.stringify(billPayload, null, 2))

            let qoyodBillId: string
            let qoyodRes: any

            if (expense.qoyodExpenseId) {
                // Update existing Bill
                qoyodRes = await qoyodRequest(`/bills/${expense.qoyodExpenseId}`, 'PUT', billPayload, config)
                qoyodBillId = expense.qoyodExpenseId
            } else {
                // Create new Bill
                qoyodRes = await qoyodRequest('/bills', 'POST', billPayload, config)
                qoyodBillId = qoyodRes.bill.id.toString()
            }

            // 3. Record Bill Payment (Skipped for Draft Bills)
            // Draft bills cannot have payments linked until they are approved in Qoyod.
            // If you want to record the payment, you must first approve the bill in the Qoyod dashboard.
            const paymentPayload = null; 

            // 4. Update local database
            await prisma.expense.update({
                where: { id },
                data: {
                    syncedToQoyod: true,
                    qoyodExpenseId: qoyodBillId,
                    lastSyncAt: new Date()
                }
            })

            // 5. Log Success
            await prisma.accountingSync.create({
                data: {
                    syncType: expense.qoyodExpenseId ? 'UPDATE' : 'CREATE',
                    recordType: 'Expense',
                    recordId: id,
                    status: 'SUCCESS',
                    qoyodId: qoyodBillId,
                    requestData: JSON.stringify({ bill: billPayload }),
                    responseData: JSON.stringify(qoyodRes),
                    completedAt: new Date()
                }
            })

            return NextResponse.json({ 
                success: true, 
                message: expense.qoyodExpenseId ? 'تم تحديث مسودة الفاتورة في قيود' : 'تم إضافة مسودة الفاتورة إلى المشتريات',
                qoyodId: qoyodBillId 
            })
        }

        // ====================================================
        // UNLINK EXPENSE (Remove from Qoyod only)
        // ====================================================
        if (type === 'unlink-expense') {
            const expense = await prisma.expense.findUnique({
                where: { id }
            })

            if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

            // 1. Delete from Qoyod if synced (V2 Bills API only)
            let qoyodDeleted = false
            if (expense.syncedToQoyod && expense.qoyodExpenseId) {
                try {
                    await qoyodRequest(`/bills/${expense.qoyodExpenseId}`, 'DELETE', null, config)
                    qoyodDeleted = true
                } catch (error: unknown) {
                    const errMsg = error instanceof Error ? error.message : String(error)
                    if (errMsg.includes('404')) {
                        // Already deleted or doesn't exist - treat as success
                        qoyodDeleted = true
                    } else {
                        console.error('Error unlinking from Qoyod:', error)
                    }
                }
            }

            // 2. Unlink locally (Keep record active)
            await prisma.expense.update({
                where: { id },
                data: {
                    syncedToQoyod: false,
                    qoyodExpenseId: null
                }
            })

            return NextResponse.json({ success: true, message: 'تم فك الارتباط مع قيود بنجاح' })
        }

        // ====================================================
        // DELETE EXPENSE
        // ====================================================
        if (type === 'delete-expense') {
            const expense = await prisma.expense.findUnique({
                where: { id }
            })

            if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

            // 1. Delete from Qoyod if synced (V2 Bills API only)
            let qoyodDeleted = false
            if (expense.syncedToQoyod && expense.qoyodExpenseId) {
                try {
                    await qoyodRequest(`/bills/${expense.qoyodExpenseId}`, 'DELETE', null, config)
                    qoyodDeleted = true
                } catch (error: unknown) {
                    const errMsg = error instanceof Error ? error.message : String(error)
                    if (errMsg.includes('404')) {
                        // Already deleted or doesn't exist - treat as success
                        qoyodDeleted = true
                    } else {
                        console.error('Error deleting bill from Qoyod:', error)
                    }
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

    } catch (error: any) {
        log.error({ err: error }, 'Qoyod sync error')

        // Attempt to log error to the database for debugging
        try {
            const body = await clonedReq.json()
            const recordType = body.type ? (body.type.charAt(0).toUpperCase() + body.type.slice(1)) : 'Unknown'
            
            await prisma.accountingSync.create({
                data: {
                    syncType: 'ERROR',
                    recordType: recordType,
                    recordId: body.id || 0,
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : String(error),
                    requestData: JSON.stringify(body),
                    completedAt: new Date()
                }
            })
        } catch (logError) {
            log.error({ err: logError }, 'Failed to log sync error to database')
        }

        return NextResponse.json(
            { error: 'فشل في المزامنة مع قيود' },
            { status: 500 }
        )
    }
}
