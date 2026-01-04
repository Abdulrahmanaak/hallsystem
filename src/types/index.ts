export type Role = 'SUPER_ADMIN' | 'HALL_OWNER' | 'ROOM_SUPERVISOR' | 'ACCOUNTANT' | 'EMPLOYEE';

import type {
  User,
  Customer,
  Hall,
  Booking,
  Invoice,
  Payment,
  Settings,
  AccountingSync
} from '@prisma/client'

export type {
  User,
  Customer,
  Hall,
  Booking,
  Invoice,
  Payment,
  Settings,
  AccountingSync
}

// Custom application types
export interface DashboardStats {
  totalBookings: number
  confirmedBookings: number
  pendingBookings: number
  totalRevenue: number
  monthlyRevenue: number
  outstandingPayments: number
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: string
  hallName: string
  customerName: string
  amount: number
}

export interface BookingWithRelations {
  id: string
  bookingNumber: string
  customer: {
    id: string
    nameAr: string
    phone: string
  }
  hall: {
    id: string
    nameAr: string
  }
  eventType: string
  eventDate: Date
  startTime: Date
  endTime: Date
  status: string
  finalAmount: number
  paidAmount?: number
}

export interface InvoiceWithRelations {
  id: string
  invoiceNumber: string
  customer: {
    nameAr: string
  }
  booking: {
    bookingNumber: string
    eventDate: Date
  }
  totalAmount: number
  paidAmount: number
  status: string
  dueDate: Date
  syncedToQoyod: boolean
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
