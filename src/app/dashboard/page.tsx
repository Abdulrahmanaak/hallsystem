import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getDashboardStats } from '@/lib/services/dashboard'
import { Calendar, ArrowLeft, DollarSign, AlertCircle, CheckCircle } from 'lucide-react'
import RevenueChart from '@/components/dashboard/RevenueChart'
import BookingStatusChart from '@/components/dashboard/BookingStatusChart'
import EventTypeChart from '@/components/dashboard/EventTypeChart'
import KPICard from '@/components/dashboard/KPICard'

// Helper for status styling
const getStatusBadge = (status: string) => {
    switch (status) {
        case 'CONFIRMED': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">مؤكد</span>
        case 'COMPLETED': return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">مكتمل</span>
        case 'PENDING': return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">معلق</span>
        case 'CANCELLED': return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">ملغي</span>
        default: return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{status}</span>
    }
}

export default async function DashboardPage() {
    const session = await auth()

    if (!session || !session.user) {
        redirect('/login')
    }

    const stats = await getDashboardStats(session.user.id)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        لوحة الحصاد
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        نظرة شاملة على أداء قاعاتك وحجوزاتك
                    </p>
                </div>
                <Link id="tour-new-booking-btn" href="/dashboard/bookings/new" className="bg-[var(--primary-600)] text-white px-6 py-2.5 rounded-xl hover:bg-[var(--primary-700)] transition-colors flex items-center justify-center gap-2 shadow-sm font-medium">
                    <span className="text-xl leading-none">+</span>
                    <span>حجز جديد</span>
                </Link>
            </div>

            {/* Top KPI Cards */}
            <div id="tour-stats-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="إجمالي الإيرادات"
                    value={new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(stats.totalRevenue)}
                    icon={<DollarSign size={20} />}
                    color="primary"
                    trend="up"
                    trendValue="+12%"
                />
                <KPICard
                    title="إجمالي الحجوزات"
                    value={stats.totalBookings}
                    icon={<Calendar size={20} />}
                    color="primary"
                    subValue="حجز مسجل في النظام"
                />
                <KPICard
                    title="الحجوزات المؤكدة"
                    value={stats.confirmedBookings}
                    icon={<CheckCircle size={20} />}
                    color="success"
                    subValue="بانتظار التنفيذ"
                />
                <KPICard
                    title="طلبات معلقة"
                    value={stats.pendingBookings}
                    icon={<AlertCircle size={20} />}
                    color="warning"
                    subValue="تحتاج إلى إجراء"
                />
            </div>

            {/* Charts Section - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-lg text-[var(--text-primary)]">الموقف المالي (آخر 6 أشهر)</h2>
                    </div>
                    <RevenueChart data={stats.monthlyStats} />
                </div>

                {/* Booking Status Distribution */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                    <h2 className="font-bold text-lg text-[var(--text-primary)] mb-6">توزيع حالات الحجز</h2>
                    <BookingStatusChart data={stats.statusStats} />
                </div>
            </div>

            {/* Charts Section - Row 2 & Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Event Types & Upcoming - Column 1 */}
                <div className="space-y-6">
                    {/* Event Types */}
                    <div className="bg-white p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                        <h2 className="font-bold text-lg text-[var(--text-primary)] mb-4">أنواع المناسبات</h2>
                        <EventTypeChart data={stats.eventTypeStats} />
                    </div>

                    {/* Upcoming Events List */}
                    <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-gray-50/50">
                            <h2 className="font-bold text-base text-[var(--text-primary)]">المناسبات القادمة</h2>
                            <Link href="/dashboard/calendar" className="text-xs text-[var(--primary-600)] hover:underline flex items-center gap-1 font-medium">
                                التقويم
                                <ArrowLeft size={12} />
                            </Link>
                        </div>
                        <div className="p-2 space-y-1">
                            {stats.upcomingEvents.length > 0 ? (
                                stats.upcomingEvents.map((event) => (
                                    <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-default group">
                                        <div className="bg-blue-50 text-blue-600 rounded-lg p-2 flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                            <Calendar size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                                                {event.customerName}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-secondary)]">
                                                <span className="flex items-center gap-1">
                                                    {new Date(event.eventDate).toLocaleDateString('ar-SA')}
                                                </span>
                                                <span>•</span>
                                                <span className="truncate">
                                                    {event.hallName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-[var(--text-secondary)] text-sm">
                                    لا توجد مناسبات قادمة
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Bookings - Columns 2 & 3 */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden h-full">
                        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
                            <h2 className="font-bold text-lg text-[var(--text-primary)]">أحدث الحجوزات</h2>
                            <Link href="/dashboard/bookings" className="text-sm px-3 py-1.5 rounded-lg bg-gray-50 text-[var(--text-secondary)] hover:bg-gray-100 transition-colors font-medium">
                                عرض الجدول الكامل
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50/50 text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">رقم الحجز</th>
                                        <th className="px-6 py-4 font-medium">العميل</th>
                                        <th className="px-6 py-4 font-medium">التاريخ</th>
                                        <th className="px-6 py-4 font-medium">المبلغ</th>
                                        <th className="px-6 py-4 font-medium">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {stats.recentBookings.length > 0 ? (
                                        stats.recentBookings.map((booking) => (
                                            <tr key={booking.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">
                                                    #{booking.bookingNumber}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                                                    {booking.customerName}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                                                    {new Date(booking.createdAt).toLocaleDateString('ar-SA')}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-[var(--text-primary)]">
                                                    {new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(booking.totalAmount)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(booking.status)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                                                لا توجد حجوزات حديثة
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
