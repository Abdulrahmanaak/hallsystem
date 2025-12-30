import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Configuration
const QOYOD_API_BASE = 'https://www.qoyod.com/api/2.0'
const FALLBACK_API_KEY = process.env.QOYOD_API_KEY || '' // Use environment variable

// Types
interface QoyodConfig {
    apiKey: string
    baseUrl: string
}

// 1. Configuration & Auth
async function getQoyodConfig(): Promise<QoyodConfig | null> {
    let settings = await prisma.settings.findUnique({
        where: { id: 'system' }
    })

    // Auto-configure if simulation was running or key missing but we have it
    if (!settings?.qoyodApiKey && FALLBACK_API_KEY) {
        console.log('Applying fallback Qoyod API key...')
        settings = await prisma.settings.upsert({
            where: { id: 'system' },
            update: { qoyodEnabled: true, qoyodApiKey: FALLBACK_API_KEY },
            create: {
                id: 'system',
                companyNameAr: 'نظام إدارة القاعات',
                qoyodEnabled: true,
                qoyodApiKey: FALLBACK_API_KEY,
                vatPercentage: 15
            }
        })
    }

    if (!settings?.qoyodEnabled || !settings?.qoyodApiKey) {
        return null
    }

    return {
        apiKey: settings.qoyodApiKey,
        baseUrl: QOYOD_API_BASE
    }
}

// 2. Helper: API Request
async function qoyodRequest(endpoint: string, method: string = 'GET', body: any = null, config: QoyodConfig) {
    const url = `${config.baseUrl}${endpoint}`

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

// 2.6 Helper: Get Unit Type ID
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

// 3. Helper: Ensure Product exists (for line items)
async function getOrCreateServiceProduct(config: QoyodConfig) {
    const productName = 'خدمة حجز قاعة' // Hall Booking Service
    const productSku = 'HALL-SERVICE'

    // Search for product by SKU or Name
    let searchRes
    try {
        // Try searching by SKU first as it's more reliable
        searchRes = await qoyodRequest(`/products?q[sku_eq]=${productSku}`, 'GET', null, config)
        if (!searchRes.products || searchRes.products.length === 0) {
            // Fallback to name search
            searchRes = await qoyodRequest(`/products?q[name_eq]=${encodeURIComponent(productName)}`, 'GET', null, config)
        }
    } catch (e: any) {
        if (e.message.includes('404')) {
            searchRes = { products: [] }
        } else {
            throw e
        }
    }

    if (searchRes.products && searchRes.products.length > 0) {
        const product = searchRes.products[0]

        // Auto-fix: Ensure track_quantity is false for Service to avoid 'inventory id missing' error
        // Qoyod might return track_quantity as boolean or string
        if (product.track_quantity === true || product.track_quantity === 'true' || product.track_quantity === 1) {
            console.log(`Auto-fixing Product ${product.id}: disabling track_quantity`)
            try {
                await qoyodRequest(`/products/${product.id}`, 'PUT', {
                    product: {
                        track_quantity: "0",
                        type: "Service"
                    }
                }, config)
            } catch (e) {
                console.warn('Failed to auto-fix product:', e)
                // Proceed anyway, maybe it wasn't critical or user permissions issue
            }
        }

        return product.id
    }

    // Prepare dependencies
    const salesAccountId = await getSalesAccountId(config)
    const unitTypeId = await getUnitTypeId(config)

    // Create product if not exists
    // Using verified payload structure from docs/testing
    const createRes = await qoyodRequest('/products', 'POST', {
        product: {
            name_ar: productName,
            name_en: 'Hall Booking Service',
            sku: productSku,
            category_id: 1, // Default category "Accessories" or general
            type: 'Service',
            product_unit_type_id: unitTypeId.toString(),

            // Selling configuration
            sale_item: "1",
            sales_account_id: salesAccountId.toString(),
            selling_price: "1.0", // Default price, overridden by invoice

            // Non-inventory settings
            purchase_item: "0",
            track_quantity: "0",

            tax_id: "1" // 15% VAT (Standard)
        }
    }, config)

    return createRes.product.id
}

// 4. Helper: Sync Customer
async function syncCustomer(customerId: string, config: QoyodConfig) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (!customer) throw new Error('Customer not found')

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

    if (searchRes.customers && searchRes.customers.length > 0) {
        return searchRes.customers[0].id
    }

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

    return createRes.contact.id
}

// API Route Handlers
// ============================================

// GET - Test Connection
export async function GET() {
    try {
        const config = await getQoyodConfig()

        if (!config) {
            return NextResponse.json({
                connected: false,
                message: 'Qoyod integration is not configured'
            })
        }

        // Test by fetching company info (usually /company or just checking valid auth)
        // We'll try fetching products as a lightweight check
        try {
            const data = await qoyodRequest('/products?limit=1', 'GET', null, config)
            return NextResponse.json({
                connected: true,
                message: 'Connected to Qoyod successfully',
                details: `Found ${data.total || 0} products`
            })
        } catch (e) {
            return NextResponse.json({
                connected: false,
                message: 'Failed to connect with provided API Key'
            })
        }
    } catch (error) {
        return NextResponse.json({
            connected: false,
            message: 'Error connecting to Qoyod'
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

            // 2. Get Service Product ID
            const productId = await getOrCreateServiceProduct(config)

            // 3. Calculate Revenue Split
            const totalAmount = Number(invoice.subtotal)
            const serviceRevenueRaw = Number(invoice.booking.serviceRevenue) || 0

            // Edge case: If services cost more than total (heavy discount), cap it
            let actualServiceRevenue = serviceRevenueRaw
            let hallRevenue = totalAmount - serviceRevenueRaw

            if (hallRevenue < 0) {
                hallRevenue = 0
                actualServiceRevenue = totalAmount
            }

            // 4. Build Line Items
            const lineItems = []

            // Hall Rental Line Item (if there's hall revenue)
            if (hallRevenue > 0) {
                lineItems.push({
                    product_id: productId,
                    description: `تأجير قاعة: ${invoice.booking.hall.nameAr} (${invoice.booking.bookingNumber})`,
                    quantity: 1,
                    unit_price: hallRevenue,
                    tax_percent: 15 // 15% VAT
                })
            }

            // Services Line Item (if there's service revenue)
            if (actualServiceRevenue > 0) {
                lineItems.push({
                    product_id: productId,
                    description: `خدمات إضافية: صبابين، ذبائح، كراتين ماء (${invoice.booking.bookingNumber})`,
                    quantity: 1,
                    unit_price: actualServiceRevenue,
                    tax_percent: 15 // 15% VAT
                })
            }

            // Fallback: If no line items (shouldn't happen), add the total
            if (lineItems.length === 0) {
                lineItems.push({
                    product_id: productId,
                    description: `حجز قاعة: ${invoice.booking.hall.nameAr} (${invoice.booking.bookingNumber})`,
                    quantity: 1,
                    unit_price: totalAmount,
                    tax_percent: 15
                })
            }

            // 5. Create Invoice in Qoyod
            const invoicePayload = {
                invoice: {
                    contact_id: contactId,
                    issue_date: invoice.issueDate.toISOString().split('T')[0],
                    due_date: invoice.dueDate.toISOString().split('T')[0],
                    reference: invoice.invoiceNumber,
                    status: 'Approved',
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
                    account_id: 1 // Default treasury/cash account. In real app, this should be configurable
                }
            }

            // We need an account_id (Treasury/Bank). 
            // For now, we'll try fetching accounts and picking the first 'Cash' or 'Bank' type
            const accountsRes = await qoyodRequest('/accounts?q[type_eq]=Asset', 'GET', null, config)
            if (accountsRes.accounts && accountsRes.accounts.length > 0) {
                // Try to find a reasonable account
                // Simplified logic: just pick first asset account or defaulting to 1 if risky
                paymentPayload.invoice_payment.account_id = accountsRes.accounts[0].id
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
