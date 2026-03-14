'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, Calendar, CreditCard, FileText, AlertTriangle, Info } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useRouter } from 'next/navigation'

const typeIcons: Record<string, React.ReactNode> = {
    NEW_BOOKING: <Calendar size={16} className="text-blue-500" />,
    BOOKING_CONFIRMED: <Check size={16} className="text-green-500" />,
    BOOKING_CANCELLED: <AlertTriangle size={16} className="text-red-500" />,
    PAYMENT_RECEIVED: <CreditCard size={16} className="text-emerald-500" />,
    INVOICE_CREATED: <FileText size={16} className="text-indigo-500" />,
    INVOICE_OVERDUE: <AlertTriangle size={16} className="text-orange-500" />,
    UPCOMING_BOOKING: <Calendar size={16} className="text-amber-500" />,
    PAYMENT_REMINDER: <CreditCard size={16} className="text-rose-500" />,
    TRIAL_EXPIRING: <AlertTriangle size={16} className="text-red-600" />,
    SYSTEM: <Info size={16} className="text-gray-500" />,
}

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

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleNotificationClick = (notification: { id: string; link: string | null; isRead: boolean }) => {
        if (!notification.isRead) {
            markAsRead(notification.id)
        }
        setIsOpen(false)
        if (notification.link) {
            router.push(notification.link)
        }
    }

    const recentNotifications = notifications.slice(0, 10)

    return (
        <div ref={dropdownRef} className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
                aria-label="الإشعارات"
            >
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] overflow-hidden"
                    style={{ maxHeight: '480px' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-800">الإشعارات</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                                <CheckCheck size={14} />
                                تحديد الكل كمقروء
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
                        {recentNotifications.length === 0 ? (
                            <div className="py-12 text-center text-gray-400">
                                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">لا توجد إشعارات</p>
                            </div>
                        ) : (
                            recentNotifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full text-right px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!notification.isRead ? 'bg-indigo-50/50' : ''
                                        }`}
                                >
                                    {/* Icon */}
                                    <div className="mt-0.5 shrink-0">
                                        {typeIcons[notification.type] || <Info size={16} className="text-gray-400" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-snug ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {timeAgo(notification.createdAt)}
                                        </p>
                                    </div>

                                    {/* Unread dot */}
                                    {!notification.isRead && (
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    router.push('/dashboard/notifications')
                                }}
                                className="w-full py-2.5 text-center text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
                            >
                                عرض جميع الإشعارات
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
