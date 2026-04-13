import { prisma } from '@/lib/prisma'
import { createTenantLogger } from '@/lib/logger'

const log = createTenantLogger({ module: 'qoyod' })

// Configuration
export const QOYOD_API_BASE = process.env.QOYOD_BASE_URL || 'https://api.qoyod.com/2.0'

export interface QoyodConfig {
    apiKey: string
    baseUrl: string
    defaultBankAccountId?: string | null
    defaultSalesAccountId?: string | null
    autoSync?: boolean
}

export interface QoyodSettings {
    qoyodApiKey: string | null
    qoyodEnabled: boolean
    qoyodDefaultBankAccountId: string | null
    qoyodDefaultSalesAccountId: string | null
    qoyodAutoSync: boolean
}

// 1. Configuration & Auth
export async function getQoyodConfig(ownerId?: string | null): Promise<QoyodConfig | null> {
    if (!ownerId) return null

    const settings = await prisma.settings.findUnique({
        where: { ownerId }
    }) as QoyodSettings | null

    if (!settings?.qoyodEnabled || !settings?.qoyodApiKey) {
        return null
    }

    // Decrypt API key if encrypted
    let apiKey = settings.qoyodApiKey
    if (apiKey && process.env.ENCRYPTION_KEY) {
        try {
            const { isEncrypted, decrypt } = await import('@/lib/encryption')
            if (isEncrypted(apiKey)) {
                apiKey = decrypt(apiKey)
            }
        } catch {
            // If decryption fails, use as-is (may be plaintext from before encryption was enabled)
        }
    }

    return {
        apiKey,
        baseUrl: QOYOD_API_BASE,
        defaultBankAccountId: settings.qoyodDefaultBankAccountId,
        defaultSalesAccountId: settings.qoyodDefaultSalesAccountId,
        autoSync: settings.qoyodAutoSync
    }
}

// 2. API Request
export async function qoyodRequest(endpoint: string, method: string = 'GET', body: unknown = null, config: QoyodConfig) {
    const baseUrl = config.baseUrl.replace(/\/+$/, '')
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
            try { parsedError = JSON.parse(errorText) } catch { /* ignore */ }

            if (response.status === 404) {
                log.warn({ method, url, status: 404 }, 'Qoyod API 404')
            } else {
                log.error({ method, url, status: response.status }, 'Qoyod API error')
            }
            const detailedMsg = parsedError ? JSON.stringify(parsedError) : errorText
            throw new Error(`Qoyod API Error: ${response.status} - ${detailedMsg}`)
        }

        const responseText = await response.text()

        if (!responseText || responseText.trim() === '') {
            return { success: true, message: 'Success' }
        }

        try {
            return JSON.parse(responseText)
        } catch {
            return { success: true, message: responseText }
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (!errorMessage.includes('404')) {
            log.error({ err: errorMessage }, 'Qoyod request failed')
        }
        throw error
    }
}

// 3. Shared Helpers

/** Get Unit Type ID for products */
export async function getUnitTypeId(config: QoyodConfig): Promise<number> {
    try {
        const res = await qoyodRequest('/product_unit_types', 'GET', null, config)
        if (res.product_unit_types?.length > 0) {
            const unit = res.product_unit_types.find((u: any) =>
                u.unit_name?.toLowerCase().includes('service') ||
                u.unit_name?.toLowerCase().includes('unit') ||
                u.unit_name?.toLowerCase().includes('piece')
            )
            return unit ? unit.id : res.product_unit_types[0].id
        }
    } catch {
        log.warn('Failed to fetch unit types, using fallback')
    }
    return 7
}

/** Get Inventory ID (required for invoices/bills) */
export async function getInventoryId(config: QoyodConfig): Promise<number> {
    try {
        const res = await qoyodRequest('/inventories', 'GET', null, config)
        if (res.inventories?.length > 0) {
            return res.inventories[0].id
        }
    } catch {
        log.warn('Failed to fetch inventories, using fallback')
    }
    return 1
}

/** Get Sales Account ID */
export async function getSalesAccountId(config: QoyodConfig): Promise<number> {
    if (config.defaultSalesAccountId) return parseInt(config.defaultSalesAccountId)

    try {
        const res = await qoyodRequest('/accounts?q[type_eq]=Revenue', 'GET', null, config)
        if (res.accounts?.length > 0) {
            const salesAcc = res.accounts.find((a: any) =>
                a.name_en?.toLowerCase().includes('sales') || a.name_ar?.includes('مبيعات')
            )
            return salesAcc ? salesAcc.id : res.accounts[0].id
        }
    } catch {
        log.warn('Failed to fetch sales accounts, using fallback')
    }
    return 17
}

/** Get or create the expense product used for purchase bill line items */
export async function getOrCreateExpenseProduct(config: QoyodConfig): Promise<number> {
    const productSku = 'EXPENSE-001'

    // 1. Search by SKU
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

    if (searchRes.products?.length > 0) {
        return searchRes.products[0].id
    }

    // 2. Search by Arabic name (existing products in Qoyod account)
    try {
        const nameRes = await qoyodRequest('/products?q[name_ar_cont]=مصروفات', 'GET', null, config)
        if (nameRes.products?.length > 0) {
            const purchaseProd = nameRes.products.find((p: any) => p.purchase_item === true)
            if (purchaseProd) return purchaseProd.id
        }
    } catch { /* continue to create */ }

    // 3. Find an expense account to link the product
    let purchaseAccountId: number | undefined
    try {
        const accRes = await qoyodRequest('/accounts?q[type_eq]=Expense', 'GET', null, config)
        if (accRes.accounts?.length > 0) {
            purchaseAccountId = accRes.accounts[0].id
        }
    } catch { /* use without account */ }

    const unitTypeId = await getUnitTypeId(config)

    // 4. Create the product
    const createRes = await qoyodRequest('/products', 'POST', {
        product: {
            name_ar: 'مصروفات عامة',
            name_en: 'General Expenses',
            sku: productSku,
            category_id: 1,
            type: 'Service',
            product_unit_type_id: unitTypeId,
            sale_item: false,
            purchase_item: true,
            ...(purchaseAccountId ? { purchase_account_id: purchaseAccountId } : {}),
            cost: 1.0,
            track_quantity: false,
            tax_id: 1,
        }
    }, config)

    return createRes.product.id
}

/** Get or create the service product used for invoice line items */
export async function getOrCreateServiceProduct(config: QoyodConfig): Promise<number> {
    const productSku = 'HALL-SVC-001'

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

    if (searchRes.products?.length > 0) {
        const product = searchRes.products[0]
        const trackQty = product.track_quantity
        if (trackQty === false || trackQty === '0' || trackQty === 0 || trackQty === 'false') {
            return product.id
        }

        try {
            await qoyodRequest(`/products/${product.id}`, 'PUT', {
                product: { track_quantity: false, type: 'Service' }
            }, config)
            return product.id
        } catch {
            log.warn('Could not update product, will create a new one')
        }
    }

    const salesAccountId = await getSalesAccountId(config)
    const unitTypeId = await getUnitTypeId(config)

    const createRes = await qoyodRequest('/products', 'POST', {
        product: {
            name_ar: 'خدمة حجز قاعة',
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
            tax_id: 1,
        }
    }, config)

    return createRes.product.id
}
