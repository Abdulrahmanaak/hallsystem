export type Role = 'ADMIN' | 'ROOM_SUPERVISOR' | 'ACCOUNTANT' | 'EMPLOYEE';

// Export all Prisma types
export type {
  User,
  UserRole,
  UserStatus,
  Customer,
  CustomerType,
  Hall,
  HallStatus,
  Booking,
  BookingStatus,
  EventType,
  Invoice,
  InvoiceStatus,
  Payment,
  PaymentMethod,
  Settings,
  AccountingSync,
  SyncType,
  SyncStatus
} from '@prisma/client'

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
