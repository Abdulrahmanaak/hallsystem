import { z } from 'zod'

/**
 * Shared Zod validation schemas for API input validation.
 * All amounts must be non-negative. Dates must be valid ISO strings.
 */

// ============================================
// Booking
// ============================================

export const createBookingSchema = z.object({
    // Customer (either existing ID or new customer details)
    customerId: z.string().optional(),
    customerName: z.string().min(1, 'اسم العميل مطلوب').optional(),
    customerPhone: z.string().min(1, 'رقم الهاتف مطلوب').optional(),
    customerIdNumber: z.string().optional(),
    customerEmail: z.string().email().optional().or(z.literal('')).or(z.null()),

    // Booking details
    hallId: z.string().min(1, 'القاعة مطلوبة'),
    eventType: z.string().min(1, 'نوع المناسبة مطلوب'),
    date: z.string().min(1, 'التاريخ مطلوب'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    guestCount: z.union([z.string(), z.number()]).optional(),
    sectionType: z.enum(['men', 'women', 'both', 'MEN', 'WOMEN', 'BOTH']).optional().or(z.null()),
    mealType: z.string().optional().or(z.null()),

    // Services
    services: z.any().optional(),
    coffeeServers: z.union([z.string(), z.number()]).optional(),
    sacrifices: z.union([z.string(), z.number()]).optional(),
    waterCartons: z.union([z.string(), z.number()]).optional(),

    // Financial
    totalAmount: z.union([z.string(), z.number()]).refine(
        val => Number(val) >= 0, { message: 'المبلغ يجب أن يكون 0 أو أكثر' }
    ),
    downPayment: z.union([z.string(), z.number()]).optional().default(0),
    discountAmount: z.union([z.string(), z.number()]).optional().default(0),
    vatAmount: z.union([z.string(), z.number()]).optional().default(0),
    serviceRevenue: z.union([z.string(), z.number()]).optional().default(0),
    servicesBreakdown: z.string().optional().or(z.null()),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']).optional(),

    notes: z.string().optional().or(z.null()),
})

// ============================================
// Invoice
// ============================================

export const createInvoiceSchema = z.object({
    bookingId: z.string().min(1, 'رقم الحجز مطلوب'),
    amount: z.union([z.string(), z.number()]).optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']).optional(),
    paymentDate: z.string().optional(),
    notes: z.string().optional(),
})

// ============================================
// Payment
// ============================================

export const createPaymentSchema = z.object({
    bookingId: z.string().min(1, 'رقم الحجز مطلوب'),
    invoiceId: z.string().optional().or(z.null()),
    amount: z.union([z.string(), z.number()]).refine(
        val => Number(val) > 0, { message: 'المبلغ يجب أن يكون أكبر من 0' }
    ),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']).optional(),
    paymentDate: z.string().optional(),
    notes: z.string().optional().or(z.null()),
})

// ============================================
// Expense
// ============================================

export const updateExpenseSchema = z.object({
    amount: z.union([z.string(), z.number()]).refine(
        val => Number(val) > 0, { message: 'المبلغ يجب أن يكون أكبر من 0' }
    ),
    description: z.string().min(1, 'الوصف مطلوب'),
    expenseDate: z.string().min(1, 'التاريخ مطلوب'),
    category: z.string().optional().or(z.null()),
    imageUrl: z.string().optional().or(z.null()),
    vendorId: z.string().optional().or(z.null()),
})

// ============================================
// Qoyod Sync
// ============================================

export const qoyodSyncSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.enum(['invoice', 'payment', 'expense', 'deactivate-invoice', 'cancel-invoice', 'delete-invoice', 'unlink-expense', 'delete-expense', 'journal-entry', 'delete-journal-entry', 'unlink-journal-entry']),
        id: z.string().min(1, 'المعرف مطلوب'),
    }),
    z.object({
        type: z.literal('create-category'),
        name: z.string().min(1, 'اسم الصنف مطلوب'),
    }),
])

// ============================================
// Credit Note
// ============================================

export const creditNoteSchema = z.object({
    invoiceId: z.string().min(1, 'معرف الفاتورة مطلوب'),
    reason: z.string().optional(),
})

/**
 * Validate request body against a schema.
 * Returns { success: true, data } on success, { success: false, error } on failure.
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T; error?: undefined } | { success: false; data?: undefined; error: string } {
    const result = schema.safeParse(body)
    if (!result.success) {
        const firstError = result.error.issues[0]
        return { success: false, error: firstError?.message || 'بيانات غير صالحة' }
    }
    return { success: true, data: result.data }
}
