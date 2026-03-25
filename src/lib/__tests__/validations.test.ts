import { describe, it, expect } from 'vitest'
import { createBookingSchema, createPaymentSchema, createInvoiceSchema, validateBody } from '../validations'

describe('validateBody', () => {
    it('returns success with valid data', () => {
        const result = validateBody(createPaymentSchema, {
            bookingId: 'abc123',
            amount: 500,
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.bookingId).toBe('abc123')
        }
    })

    it('returns error for missing required field', () => {
        const result = validateBody(createPaymentSchema, {
            amount: 500,
        })
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error).toBeTruthy()
        }
    })
})

describe('createBookingSchema', () => {
    const validBooking = {
        hallId: 'hall-1',
        eventType: 'wedding',
        date: '2025-06-15',
        totalAmount: 5000,
    }

    it('accepts valid booking data', () => {
        const result = createBookingSchema.safeParse(validBooking)
        expect(result.success).toBe(true)
    })

    it('rejects negative totalAmount', () => {
        const result = createBookingSchema.safeParse({ ...validBooking, totalAmount: -100 })
        expect(result.success).toBe(false)
    })

    it('accepts string amounts (from form data)', () => {
        const result = createBookingSchema.safeParse({ ...validBooking, totalAmount: '5000' })
        expect(result.success).toBe(true)
    })

    it('rejects empty hallId', () => {
        const result = createBookingSchema.safeParse({ ...validBooking, hallId: '' })
        expect(result.success).toBe(false)
    })
})

describe('createPaymentSchema', () => {
    it('rejects zero amount', () => {
        const result = createPaymentSchema.safeParse({
            bookingId: 'abc',
            amount: 0,
        })
        expect(result.success).toBe(false)
    })

    it('accepts valid payment methods', () => {
        const result = createPaymentSchema.safeParse({
            bookingId: 'abc',
            amount: 100,
            paymentMethod: 'CARD',
        })
        expect(result.success).toBe(true)
    })

    it('rejects invalid payment methods', () => {
        const result = createPaymentSchema.safeParse({
            bookingId: 'abc',
            amount: 100,
            paymentMethod: 'BITCOIN',
        })
        expect(result.success).toBe(false)
    })
})

describe('createInvoiceSchema', () => {
    it('requires bookingId', () => {
        const result = createInvoiceSchema.safeParse({})
        expect(result.success).toBe(false)
    })

    it('accepts minimal invoice data', () => {
        const result = createInvoiceSchema.safeParse({ bookingId: 'abc' })
        expect(result.success).toBe(true)
    })
})
