export type UserRole = 'SUPER_ADMIN' | 'HALL_OWNER' | 'ROOM_SUPERVISOR' | 'ACCOUNTANT' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type CustomerType = 'INDIVIDUAL' | 'COMPANY';
export type HallStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type BookingStatus = 'TENTATIVE' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type EventType = 'WEDDING' | 'ENGAGEMENT' | 'BIRTHDAY' | 'CONFERENCE' | 'GRADUATION' | 'OTHER';
export type InvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER';
export type SyncType = 'CUSTOMER' | 'INVOICE' | 'PAYMENT' | 'GENERAL';
export type SyncStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export type NotificationType =
    | 'NEW_BOOKING'
    | 'BOOKING_CONFIRMED'
    | 'BOOKING_CANCELLED'
    | 'PAYMENT_RECEIVED'
    | 'INVOICE_CREATED'
    | 'INVOICE_OVERDUE'
    | 'UPCOMING_BOOKING'
    | 'PAYMENT_REMINDER'
    | 'TRIAL_EXPIRING'
    | 'SYSTEM';
