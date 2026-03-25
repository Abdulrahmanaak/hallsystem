import { describe, it, expect } from 'vitest'
import { calculateVATFromInclusive, calculateVATFromExclusive, getVATRate } from '../vat'

describe('calculateVATFromInclusive', () => {
    it('calculates 15% VAT from inclusive amount', () => {
        const result = calculateVATFromInclusive(1150, 15)
        expect(result.totalAmount).toBe(1150)
        expect(result.subtotal).toBe(1000)
        expect(result.vatAmount).toBe(150)
        expect(result.vatPercentage).toBe(15)
    })

    it('handles zero amount', () => {
        const result = calculateVATFromInclusive(0, 15)
        expect(result.totalAmount).toBe(0)
        expect(result.subtotal).toBe(0)
        expect(result.vatAmount).toBe(0)
    })

    it('handles negative amount', () => {
        const result = calculateVATFromInclusive(-100, 15)
        expect(result.totalAmount).toBe(0)
        expect(result.subtotal).toBe(0)
    })

    it('subtotal + vatAmount equals totalAmount', () => {
        const result = calculateVATFromInclusive(5000, 15)
        expect(result.subtotal + result.vatAmount).toBeCloseTo(5000, 1)
    })

    it('handles 0% VAT rate', () => {
        const result = calculateVATFromInclusive(1000, 0)
        expect(result.subtotal).toBe(1000)
        expect(result.vatAmount).toBe(0)
    })

    it('defaults to 15% when no rate provided', () => {
        const result = calculateVATFromInclusive(1150)
        expect(result.subtotal).toBe(1000)
    })

    it('handles fractional amounts with rounding', () => {
        const result = calculateVATFromInclusive(100, 15)
        // 100 / 1.15 = 86.956521...
        expect(result.subtotal).toBe(86.96)
        expect(result.vatAmount).toBe(13.04)
    })
})

describe('calculateVATFromExclusive', () => {
    it('calculates 15% VAT from exclusive amount', () => {
        const result = calculateVATFromExclusive(1000, 15)
        expect(result.subtotal).toBe(1000)
        expect(result.vatAmount).toBe(150)
        expect(result.totalAmount).toBe(1150)
    })

    it('handles zero amount', () => {
        const result = calculateVATFromExclusive(0, 15)
        expect(result.totalAmount).toBe(0)
    })
})

describe('getVATRate', () => {
    it('returns the rate when valid', () => {
        expect(getVATRate(15)).toBe(15)
        expect(getVATRate('15')).toBe(15)
        expect(getVATRate(0)).toBe(0)
    })

    it('returns 15 for invalid inputs', () => {
        expect(getVATRate(undefined)).toBe(15)
        expect(getVATRate('abc')).toBe(15)
        expect(getVATRate(-5)).toBe(15)
        expect(getVATRate(101)).toBe(15)
    })

    it('treats null as 0 (Number(null) === 0)', () => {
        expect(getVATRate(null)).toBe(0)
    })
})
