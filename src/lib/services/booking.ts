import type { User } from "@/types"

export type BookingStatus = 'TENTATIVE' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';

export interface Booking {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    date: string; // ISO Date string
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    hallId: string;
    status: BookingStatus;
    totalAmount: number;
    createdAt: string;
}

const MOCK_BOOKINGS: Booking[] = [
    {
        id: '1',
        customerName: 'Ahmed Al-Sayed',
        customerEmail: 'ahmed@example.com',
        customerPhone: '0501234567',
        date: '2023-12-15',
        startTime: '18:00',
        endTime: '23:00',
        hallId: 'hall-1',
        status: 'CONFIRMED',
        totalAmount: 5000,
        createdAt: '2023-12-01T10:00:00Z',
    },
    {
        id: '2',
        customerName: 'Sarah Khalid',
        customerEmail: 'sarah@example.com',
        customerPhone: '0559876543',
        date: '2023-12-20',
        startTime: '19:00',
        endTime: '23:30',
        hallId: 'hall-2',
        status: 'TENTATIVE',
        totalAmount: 7500,
        createdAt: '2023-12-05T14:30:00Z',
    },
];

export const bookingService = {
    getBookings: async (): Promise<Booking[]> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return [...MOCK_BOOKINGS];
    },

    createBooking: async (booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const newBooking: Booking = {
            ...booking,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
        };
        MOCK_BOOKINGS.push(newBooking);
        return newBooking;
    },

    updateStatus: async (id: string, status: BookingStatus): Promise<Booking> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const booking = MOCK_BOOKINGS.find((b) => b.id === id);
        if (!booking) throw new Error('Booking not found');
        booking.status = status;
        return booking;
    }
};
