import { prisma } from "@/lib/prisma"

export interface RecentBooking {
    id: string
    customerName: string
    bookingNumber: string
    createdAt: Date
    status: string
    totalAmount: number
}

export interface UpcomingEvent {
    id: string
    eventDate: Date
    startTime: Date
    hallName: string
    eventType: string
    customerName: string
}

export interface MonthlyStat {
    name: string // Month name
    revenue: number
    expenses: number
}

export interface StatusStat {
    name: string // Status
    value: number
    color: string
}

export interface EventTypeStat {
    name: string // Event Type
    value: number
}

export interface DashboardStats {
    totalBookings: number
    confirmedBookings: number
    pendingBookings: number
    totalRevenue: number
    recentBookings: RecentBooking[]
    upcomingEvents: UpcomingEvent[]
    monthlyStats: MonthlyStat[]
    statusStats: StatusStat[]
    eventTypeStats: EventTypeStat[]
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
    // 1. Determine the ownerId
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, ownerId: true }
    })

    if (!user) {
        throw new Error("User not found")
    }

    const ownerId = user.role === 'HALL_OWNER' ? user.id : user.ownerId

    if (!ownerId) {
        return {
            totalBookings: 0,
            confirmedBookings: 0,
            pendingBookings: 0,
            totalRevenue: 0,
            recentBookings: [],
            upcomingEvents: [],
            monthlyStats: [],
            statusStats: [],
            eventTypeStats: []
        }
    }

    // 2. Fetch Stats in parallel
    const [
        totalBookings,
        confirmedBookings,
        pendingBookings,
        revenueAgg,
        recentBookingsRaw,
        upcomingEventsRaw,
        bookingsByStatus,
        bookingsByType
    ] = await Promise.all([
        // Counts
        prisma.booking.count({ where: { ownerId } }),
        prisma.booking.count({
            where: {
                ownerId,
                status: { in: ['CONFIRMED', 'COMPLETED', 'CHECKED_IN'] }
            }
        }),
        prisma.booking.count({
            where: {
                ownerId,
                status: 'PENDING'
            }
        }),
        // Revenue
        prisma.booking.aggregate({
            where: {
                ownerId,
                status: { not: 'CANCELLED' }
            },
            _sum: {
                totalAmount: true
            }
        }),
        // Recent Bookings
        prisma.booking.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                customer: { select: { nameAr: true } }
            }
        }),
        // Upcoming Events
        prisma.booking.findMany({
            where: {
                ownerId,
                status: { in: ['CONFIRMED', 'CHECKED_IN'] },
                eventDate: { gte: new Date() }
            },
            orderBy: { eventDate: 'asc' },
            take: 5,
            include: {
                customer: { select: { nameAr: true } },
                hall: { select: { nameAr: true } }
            }
        }),
        // Status Distribution
        prisma.booking.groupBy({
            by: ['status'],
            where: { ownerId },
            _count: { id: true }
        }),
        // Event Type Distribution
        prisma.booking.groupBy({
            by: ['eventType'],
            where: { ownerId },
            _count: { id: true }
        })
    ])

    // 3. Calculate Monthly Stats manually (for simplicity and DB compatibility)
    // Fetch all bookings with revenue in last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueBookings = await prisma.booking.findMany({
        where: {
            ownerId,
            status: { not: 'CANCELLED' },
            eventDate: { gte: sixMonthsAgo }
        },
        select: {
            eventDate: true,
            totalAmount: true
        }
    });

    // Group by month
    const monthlyData: Record<string, { revenue: number, expenses: number }> = {};
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        // Use Arabic locale for month names
        const monthKey = d.toLocaleString('ar-SA', { month: 'long' });
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
    }

    revenueBookings.forEach(b => {
        const monthKey = b.eventDate.toLocaleString('ar-SA', { month: 'long' });
        if (monthlyData[monthKey]) {
            monthlyData[monthKey].revenue += Number(b.totalAmount);
        }
    });

    const monthlyStats: MonthlyStat[] = Object.entries(monthlyData).map(([name, data]) => ({
        name,
        revenue: data.revenue,
        expenses: data.expenses
    }));

    // 4. Format Data
    const recentBookings: RecentBooking[] = recentBookingsRaw.map(b => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        customerName: b.customer.nameAr,
        createdAt: b.createdAt,
        status: b.status,
        totalAmount: Number(b.totalAmount)
    }))

    const upcomingEvents: UpcomingEvent[] = upcomingEventsRaw.map(b => {
        // Translate Event Type for the list
        const eventTypeMap: Record<string, string> = {
            WEDDING: 'زواج',
            ENGAGEMENT: 'خطوبة',
            BIRTHDAY: 'عيد ميلاد',
            CONFERENCE: 'مؤتمر',
            GRADUATION: 'تخرج',
            OTHER: 'أخرى'
        }
        return {
            id: b.id,
            eventDate: b.eventDate,
            startTime: b.startTime,
            hallName: b.hall.nameAr,
            eventType: eventTypeMap[b.eventType] || b.eventType,
            customerName: b.customer.nameAr
        }
    })

    const statusColors: Record<string, string> = {
        CONFIRMED: '#22c55e', // Green
        COMPLETED: '#3b82f6', // Blue
        PENDING: '#eab308', // Yellow
        CANCELLED: '#ef4444', // Red
        CHECKED_IN: '#8b5cf6' // Purple
    }

    const statusTranslations: Record<string, string> = {
        CONFIRMED: 'مؤكد',
        COMPLETED: 'مكتمل',
        PENDING: 'معلق',
        CANCELLED: 'ملغي',
        CHECKED_IN: 'تم الدخول'
    }

    const statusStats: StatusStat[] = bookingsByStatus.map(s => ({
        name: statusTranslations[s.status] || s.status,
        value: s._count.id,
        color: statusColors[s.status] || '#9ca3af'
    }))

    const eventTypeTranslations: Record<string, string> = {
        WEDDING: 'زواج',
        ENGAGEMENT: 'خطوبة',
        BIRTHDAY: 'عيد ميلاد',
        CONFERENCE: 'مؤتمر',
        GRADUATION: 'تخرج',
        OTHER: 'أخرى'
    }

    const eventTypeStats: EventTypeStat[] = bookingsByType.map(t => ({
        name: eventTypeTranslations[t.eventType] || t.eventType,
        value: t._count.id
    }))

    return {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        totalRevenue: revenueAgg._sum.totalAmount ? Number(revenueAgg._sum.totalAmount) : 0,
        recentBookings,
        upcomingEvents,
        monthlyStats,
        statusStats,
        eventTypeStats
    }
}
