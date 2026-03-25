/**
 * VAT Calculation Utility
 * Single source of truth for all VAT calculations in the system.
 *
 * The Hall System uses VAT-INCLUSIVE pricing:
 * - All amounts stored in the database include VAT
 * - When sending to Qoyod, we set tax_inclusive: true
 */

export interface VATBreakdown {
    /** The total amount including VAT */
    totalAmount: number
    /** The amount before VAT */
    subtotal: number
    /** The VAT amount */
    vatAmount: number
    /** The VAT rate as a percentage (e.g. 15) */
    vatPercentage: number
}

/**
 * Calculate VAT breakdown from a VAT-inclusive total amount.
 *
 * @param totalAmountInclusive - The total amount that already includes VAT
 * @param vatPercentage - The VAT rate as a percentage (default: 15)
 * @returns VATBreakdown with subtotal, vatAmount, and totalAmount
 *
 * @example
 * ```ts
 * const vat = calculateVATFromInclusive(1150, 15)
 * // { totalAmount: 1150, subtotal: 1000, vatAmount: 150, vatPercentage: 15 }
 * ```
 */
export function calculateVATFromInclusive(totalAmountInclusive: number, vatPercentage: number = 15): VATBreakdown {
    if (totalAmountInclusive <= 0) {
        return { totalAmount: 0, subtotal: 0, vatAmount: 0, vatPercentage }
    }

    const vatRate = vatPercentage / 100
    const subtotal = totalAmountInclusive / (1 + vatRate)
    const vatAmount = totalAmountInclusive - subtotal

    return {
        totalAmount: totalAmountInclusive,
        subtotal: Math.round(subtotal * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        vatPercentage,
    }
}

/**
 * Calculate VAT breakdown from a VAT-exclusive subtotal.
 *
 * @param subtotal - The amount before VAT
 * @param vatPercentage - The VAT rate as a percentage (default: 15)
 * @returns VATBreakdown with subtotal, vatAmount, and totalAmount
 */
export function calculateVATFromExclusive(subtotal: number, vatPercentage: number = 15): VATBreakdown {
    if (subtotal <= 0) {
        return { totalAmount: 0, subtotal: 0, vatAmount: 0, vatPercentage }
    }

    const vatRate = vatPercentage / 100
    const vatAmount = subtotal * vatRate
    const totalAmount = subtotal + vatAmount

    return {
        totalAmount: Math.round(totalAmount * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
        vatPercentage,
    }
}

/**
 * Get the VAT percentage from settings, with a safe default.
 */
export function getVATRate(settingsVatPercentage: unknown): number {
    const rate = Number(settingsVatPercentage)
    if (isNaN(rate) || rate < 0 || rate > 100) {
        return 15 // Saudi Arabia standard VAT
    }
    return rate
}
