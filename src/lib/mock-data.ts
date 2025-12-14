// Removed unused imports

export const MOCK_HALLS = [
    {
        id: 'hall-1',
        nameAr: 'القاعة الملكية - الكبرى',
        capacity: 500,
        basePrice: 15000,
        amenities: '{"sound": true, "lighting": true, "dinner": true}',
        location: 'الدور الأرضي',
        status: 'ACTIVE'
    },
    {
        id: 'hall-2',
        nameAr: 'قاعة اللؤلؤة - الصغرى',
        capacity: 200,
        basePrice: 8000,
        amenities: '{"sound": true, "lighting": false, "dinner": true}',
        location: 'الدور الأول',
        status: 'ACTIVE'
    },
    {
        id: 'hall-3',
        nameAr: 'قاعة الاجتماعات VIP',
        capacity: 50,
        basePrice: 3000,
        amenities: '{"projector": true, "wifi": true, "coffee": true}',
        location: 'الجناح الشرقي',
        status: 'ACTIVE'
    }
]

export const MOCK_CUSTOMERS = [
    {
        id: 'cust-1',
        nameAr: 'أحمد محمد العتيبي',
        phone: '0501234567',
        email: 'ahmed@example.com',
        customerType: 'INDIVIDUAL',
        createdAt: new Date('2024-01-15')
    },
    {
        id: 'cust-2',
        nameAr: 'شركة المناسبات الحديثة',
        phone: '0559876543',
        email: 'info@events-co.com',
        customerType: 'COMPANY',
        createdAt: new Date('2024-02-20')
    },
    {
        id: 'cust-3',
        nameAr: 'سارة عبدالله الشمري',
        phone: '0541122334',
        email: 'sara@example.com',
        customerType: 'INDIVIDUAL',
        createdAt: new Date('2024-03-10')
    }
]

export const MOCK_BOOKINGS = [
    {
        id: 'bk-1',
        bookingNumber: 'BK-2024-1001',
        customerId: 'cust-1',
        customer: MOCK_CUSTOMERS[0],
        hallId: 'hall-1',
        hall: MOCK_HALLS[0],
        eventType: 'WEDDING',
        eventDate: new Date('2024-06-15'),
        startTime: new Date('2024-06-15T16:00:00'),
        endTime: new Date('2024-06-15T23:00:00'),
        guestCount: 450,
        totalAmount: 15000,
        paidAmount: 5000,
        finalAmount: 16500, // +VAT
        status: 'CONFIRMED',
        createdAt: new Date('2024-05-01')
    },
    {
        id: 'bk-2',
        bookingNumber: 'BK-2024-1002',
        customerId: 'cust-2',
        customer: MOCK_CUSTOMERS[1],
        hallId: 'hall-3',
        hall: MOCK_HALLS[2],
        eventType: 'CONFERENCE',
        eventDate: new Date('2024-06-20'),
        startTime: new Date('2024-06-20T09:00:00'),
        endTime: new Date('2024-06-20T17:00:00'),
        guestCount: 40,
        totalAmount: 3000,
        paidAmount: 3300,
        finalAmount: 3300,
        status: 'COMPLETED',
        createdAt: new Date('2024-05-10')
    },
    {
        id: 'bk-3',
        bookingNumber: 'BK-2024-1003',
        customerId: 'cust-3',
        customer: MOCK_CUSTOMERS[2],
        hallId: 'hall-2',
        hall: MOCK_HALLS[1],
        eventType: 'BIRTHDAY',
        eventDate: new Date('2024-07-05'),
        startTime: new Date('2024-07-05T18:00:00'),
        endTime: new Date('2024-07-05T22:00:00'),
        guestCount: 150,
        totalAmount: 8000,
        paidAmount: 0,
        finalAmount: 8800,
        status: 'PENDING',
        createdAt: new Date('2024-06-01')
    }
]

export const MOCK_STATS = {
    totalBookings: 15,
    confirmedBookings: 8,
    pendingBookings: 4,
    totalRevenue: 125000,
    monthlyRevenue: 45000,
    outstandingPayments: 12000
}
