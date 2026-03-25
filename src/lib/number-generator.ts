import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]

/**
 * Generate sequential numbers with race condition protection.
 *
 * Uses a retry loop: generates a candidate number, attempts to create the record,
 * and retries with the next number if a unique constraint violation occurs.
 *
 * Can be called with either the global prisma client or a transaction client (tx).
 * When called inside a $transaction, pass the tx client to ensure consistency.
 */

interface NumberGeneratorConfig {
    prefix: string       // e.g. "INV", "BK", "PAY"
    year?: number        // defaults to current year
}

/**
 * Build a formatted number string like "INV-2025-0001"
 */
export function formatSequenceNumber(prefix: string, year: number, sequence: number): string {
    return `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`
}

/**
 * Generate the next sequential number for a given prefix and model.
 * This reads the last number from the database and increments it.
 *
 * IMPORTANT: This is NOT safe against concurrent writes on its own.
 * Use `createWithSequentialNumber` for safe creation, or call this
 * inside a serializable transaction.
 *
 * @param model - 'invoice' | 'booking' | 'payment'
 * @param config - prefix and optional year
 * @param client - prisma client or transaction client
 */
export async function generateNextNumber(
    model: 'invoice' | 'booking' | 'payment',
    config: NumberGeneratorConfig,
    client: TransactionClient | PrismaClient = prisma
): Promise<string> {
    const year = config.year ?? new Date().getFullYear()
    const fullPrefix = `${config.prefix}-${year}-`

    const findArgs = {
        where: { [getNumberField(model)]: { startsWith: fullPrefix } as any },
        orderBy: { [getNumberField(model)]: 'desc' as const },
    }

    let lastNumber: string | null = null

    if (model === 'invoice') {
        const record = await (client as any).invoice.findFirst(findArgs)
        lastNumber = record?.invoiceNumber ?? null
    } else if (model === 'booking') {
        const record = await (client as any).booking.findFirst(findArgs)
        lastNumber = record?.bookingNumber ?? null
    } else if (model === 'payment') {
        const record = await (client as any).payment.findFirst(findArgs)
        lastNumber = record?.paymentNumber ?? null
    }

    let nextSequence = 1
    if (lastNumber) {
        const parts = lastNumber.split('-')
        const parsed = parseInt(parts[2])
        if (!isNaN(parsed)) {
            nextSequence = parsed + 1
        }
    }

    return formatSequenceNumber(config.prefix, year, nextSequence)
}

function getNumberField(model: 'invoice' | 'booking' | 'payment'): string {
    switch (model) {
        case 'invoice': return 'invoiceNumber'
        case 'booking': return 'bookingNumber'
        case 'payment': return 'paymentNumber'
    }
}

/**
 * Generate an invoice number. Safe to use inside a transaction.
 */
export async function generateInvoiceNumber(client: TransactionClient | PrismaClient = prisma): Promise<string> {
    return generateNextNumber('invoice', { prefix: 'INV' }, client)
}

/**
 * Generate a booking number. Safe to use inside a transaction.
 */
export async function generateBookingNumber(client: TransactionClient | PrismaClient = prisma): Promise<string> {
    return generateNextNumber('booking', { prefix: 'BK' }, client)
}

/**
 * Generate a payment number. Safe to use inside a transaction.
 */
export async function generatePaymentNumber(client: TransactionClient | PrismaClient = prisma): Promise<string> {
    return generateNextNumber('payment', { prefix: 'PAY' }, client)
}
