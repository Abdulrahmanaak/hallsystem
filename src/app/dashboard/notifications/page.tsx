'use client'

import { useState } from 'react'
import {
    Bell,
    Check,
    CheckCheck,
    Calendar,
    CreditCard,
    FileText,
    AlertTriangle,
    Info,
    Filter,
    Loader2,
    Settings,
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useRouter } from 'next/navigation'
import NotificationSettings from '@/components/notifications/NotificationSettings'

const typeIcons: Record<string, React.ReactNode> = {
    NEW_BOOKING: <Calendar size={18} className="text-blue-500" />,
    BOOKING_CONFIRMED: <Check size={18} className="text-green-500" />,
    BOOKING_CANCELLED: <AlertTriangle size={18} className="text-red-500" />,
    PAYMENT_RECEIVED: <CreditCard size={18} className="text-emerald-500" />,
    INVOICE_CREATED: <FileText size={18} className="text-indigo-500" />,
    INVOICE_OVERDUE: <AlertTriangle size={18} className="text-orange-500" />,
    UPCOMING_BOOKING: <Calendar size={18} className="text-amber-500" />,
    PAYMENT_REMINDER: <CreditCard size={18} className="text-rose-500" />,
    TRIAL_EXPIRING: <AlertTriangle size={18} className="text-red-600" />,
    SYSTEM: <Info size={18} className="text-gray-500" />,
}

const typeLabels: Record<string, string> = {
    NEW_BOOKING: 'حجز جديد',
    BOOKING_CONFIRMED: 'تأكيد حجز',
    BOOKING_CANCELLED: 'إلغاء حجز',
    PAYMENT_RECEIVED: 'دفعة جديدة',
    INVOICE_CREATED: 'فاتورة جديدة',
    INVOICE_OVERDUE: 'فاتورة متأخرة',
    UPCOMING_BOOKING: 'حجز قادم',
    PAYMENT_REMINDER: 'تذكير بدفعة',
    TRIAL_EXPIRING: 'انتهاء التجربة',
    SYSTEM: 'النظام',
}

const filterOptions = [
    { value: 'all', label: 'الكل' },
    { value: 'unread', label: 'غير مقروء' },
    { value: 'bookings', label: 'الحجوزات' },
    { value: 'payments', label: 'المدفوعات' },
    { value: 'invoices', label: 'الفواتير' },
]

const bookingTypes = ['NEW_BOOKING', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'UPCOMING_BOOKING']
const paymentTypes = ['PAYMENT_RECEIVED', 'PAYMENT_REMINDER']
const invoiceTypes = ['INVOICE_CREATED', 'INVOICE_OVERDUE']

function timeAgo(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    if (diffDays < 7) return `منذ ${diffDays} يوم`
    return date.toLocaleDateString('ar-SA')
}

export default function NotificationsPage() {
    const { notifications, unreadCount, isLoading, hasMore, markAsRead, markAllAsRead, loadMore } = useNotifications()
    const [activeFilter, setActiveFilter] = useState('all')
    const [showSettings, setShowSettings] = useState(false)
    const router = useRouter()

    const filteredNotifications = notifications.filter((n) => {
        switch (activeFilter) {
            case 'unread':
                return !n.isRead
            case 'bookings':
                return bookingTypes.includes(n.type)
            case 'payments':
                return paymentTypes.includes(n.type)
            case 'invoices':
                return invoiceTypes.includes(n.type)
            default:
                return true
        }
    })

    const handleClick = (notification: { id: string; link: string | null; isRead: boolean }) => {
        if (!notification.isRead) {
            markAsRead(notification.id)
        }
        if (notification.link) {
            router.push(notification.link)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Bell size={22} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">الإشعارات</h1>
                        {unreadCount > 0 && (
                            <p className="text-sm text-gray-500">
                                {unreadCount} إشعار غير مقروء
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-colors border ${showSettings
                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                            : 'text-gray-500 hover:bg-gray-100 border-gray-200'
                            }`}
                        title="إعدادات الإشعارات"
                    >
                        <Settings size={20} />
                    </button>

                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllAsRead()}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                        >
                            <CheckCheck size={16} />
                            تحديد الكل كمقروء
                        </button>
                    )}
                </div>
            </div>

            {showSettings && <NotificationSettings />}

            {/* Filters */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                <Filter size={16} className="text-gray-400 shrink-0" />
                {filterOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setActiveFilter(option.value)}
                        className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${activeFilter === option.value
                            ? 'bg-indigo-100 text-indigo-700 font-medium'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {filteredNotifications.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center">
                        <Bell size={40} className="mb-3 text-gray-300" />
                        <p className="text-gray-400 font-medium">لا توجد إشعارات</p>
                        <p className="text-sm text-gray-300 mt-1">
                            {activeFilter !== 'all' ? 'جرب تغيير الفلتر' : 'الإشعارات الجديدة ستظهر هنا'}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((notification, index) => (
                        <button
                            key={notification.id}
                            onClick={() => handleClick(notification)}
                            className={`w-full text-right px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${index < filteredNotifications.length - 1 ? 'border-b border-gray-100' : ''
                                } ${!notification.isRead ? 'bg-indigo-50/40' : ''}`}
                        >
                            {/* Icon */}
                            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                                {typeIcons[notification.type] || <Info size={18} className="text-gray-400" />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                        {notification.title}
                                    </p>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">
                                        {typeLabels[notification.type] || notification.type}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1.5">
                                    {timeAgo(notification.createdAt)}
                                </p>
                            </div>

                            {/* Unread indicator */}
                            {!notification.isRead && (
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                            )}
                        </button>
                    ))
                )}
            </div>

            {/* Load More */}
            {hasMore && (
                <div className="mt-4 text-center">
                    <button
                        onClick={loadMore}
                        className="px-6 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                    >
                        تحميل المزيد
                    </button>
                </div>
            )}
        </div>
    )
}
