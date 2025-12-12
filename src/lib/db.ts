// Temporary mock data module for bookings page
// TODO: Replace with actual Prisma queries

export interface Booking {
    id: string
    customerName: string
    hallId: string
    date: string
    status: 'Confirmed' | 'Pending' | 'Cancelled'
    totalAmount: number
}

export const HALLS = [
    { id: 'h1', name: 'قاعة الملك' },
    { id: 'h2', name: 'قاعة الأمير' },
    { id: 'h3', name: 'قاعة الفخامة' }
]

export const MOCK_BOOKINGS: Booking[] = [
    {
        id: 'b1',
        customerName: 'أحمد محمد',
        hallId: 'h1',
        date: '2024-12-20',
        status: 'Confirmed',
        totalAmount: 15000
    },
    {
        id: 'b2',
        customerName: 'فاطمة علي',
        hallId: 'h2',
        date: '2024-12-25',
        status: 'Pending',
        totalAmount: 20000
    },
    {
        id: 'b3',
        customerName: 'محمد خالد',
        hallId: 'h3',
        date: '2024-12-15',
        status: 'Confirmed',
        totalAmount: 18000
    }
]

export function getHallName(hallId: string): string {
    const hall = HALLS.find(h => h.id === hallId)
    return hall ? hall.name : 'قاعة غير معروفة'
}
