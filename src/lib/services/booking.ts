import type { User } from "@/types"

export type BookingStatus = 'TENTATIVE' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';

export interface Booking {
    id: string;
    bookingNumber?: string; // Added
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    customerIdNumber?: string;
    date: string; // ISO Date string
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    guestCount?: number;
    sectionType?: string;
    mealType?: string;
    services?: string[]; // Array of IDs
    hallId: string;
    hallName?: string; // Added for display
    status: BookingStatus;
    totalAmount: number;
    downPayment?: number;
    coffeeServers?: number;
    sacrifices?: number;
    createdAt: string;
}

export const bookingService = {
    getBookings: async (): Promise<Booking[]> => {
        const res = await fetch('/api/bookings', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch bookings');
        return res.json();
    },

    createBooking: async (booking: Omit<Booking, 'id' | 'createdAt' | 'status'> & { status?: string, coffeeServers?: number, sacrifices?: number }): Promise<Booking> => {
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to create booking');
        }
        return res.json();
    },

    updateStatus: async (id: string, status: BookingStatus): Promise<Booking> => {
        // We need an endpoint for this, assuming generic update or specific status endpoint.
        // For now, if no endpoint exists, we might need to add one.
        // Let's assume PUT /api/bookings/[id] works or we mock this part if urgency logic is mostly Create.
        // But user said "rebuild DB... save and show". Status update is secondary but important.
        // I will IMPLEMENT IT using a simple fetch to /api/bookings/[id] if I can. 
        // But checking the directory structure, I saw [id] folder.

        const res = await fetch(`/api/bookings/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Failed to update status');
        return res.json();
    }
};
