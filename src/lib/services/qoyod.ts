import { prisma } from '@/lib/prisma'

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

    return {
        apiKey: settings.qoyodApiKey,
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
            if (response.status === 404) {
                console.warn(`Qoyod API [${method} ${url}]: 404 - ${errorText}`)
            } else {
                console.error(`Qoyod API Error [${method} ${url}]:`, response.status, errorText)
            }
            throw new Error(`Qoyod API Error: ${response.status} - ${errorText}`)
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
            console.error('Qoyod Request Failed:', errorMessage)
        }
        throw error
    }
}
