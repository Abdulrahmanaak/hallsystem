'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    ChevronRight,
    ChevronLeft,
    Calendar as CalendarIcon,
    Users,
    Clock
} from 'lucide-react'

interface Booking {
    id: string
    bookingNumber: string
    customerName: string
    hallId: string
    hallName: string
    eventType: string
    date: string
    startTime: string
    endTime: string
    guestCount: number | null
    status: string
    totalAmount: number
    finalAmount: number
}

interface Hall {
    id: string
    name: string
    capacity: number
}

const EVENT_TYPES: Record<string, string> = {
    'WEDDING': 'زفاف',
    'ENGAGEMENT': 'خطوبة',
    'BIRTHDAY': 'عيد ميلاد',
    'CONFERENCE': 'مؤتمر',
    'GRADUATION': 'تخرج',
    'OTHER': 'أخرى'
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'قيد الانتظار' },
    'CONFIRMED': { bg: 'bg-green-100', text: 'text-green-800', label: 'مؤكد' },
    'CANCELLED': { bg: 'bg-red-100', text: 'text-red-800', label: 'ملغي' },
    'COMPLETED': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'مكتمل' }
}

const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const ARABIC_MONTHS = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

export default function CalendarPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [halls, setHalls] = useState<Hall[]>([])
    const [selectedHall, setSelectedHall] = useState<string>('all')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState<Date | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            fetch('/api/bookings').then(r => r.json()),
            fetch('/api/halls').then(r => r.json())
        ]).then(([bookingsData, hallsData]) => {
            setBookings(bookingsData)
            setHalls(hallsData)
            setLoading(false)
        }).catch(err => {
            console.error('Error loading data:', err)
            setLoading(false)
        })
    }, [])

    // Get first day of month and days in month
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startDay = firstDayOfMonth.getDay()

    // Generate calendar days
    const calendarDays: (number | null)[] = []
    for (let i = 0; i < startDay; i++) {
        calendarDays.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i)
    }

    // Filter bookings
    const filteredBookings = selectedHall === 'all'
        ? bookings
        : bookings.filter(b => b.hallId === selectedHall)

    // Get bookings for a specific day
    const getBookingsForDay = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        return filteredBookings.filter(b => b.date === dateStr)
    }

    // Navigation
    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
        setSelectedDay(null)
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
        setSelectedDay(null)
    }

    const goToToday = () => {
        setCurrentDate(new Date())
        setSelectedDay(new Date())
    }

    // Check if a day is today
    const isToday = (day: number) => {
        const today = new Date()
        return day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear()
    }

    // Get selected day bookings
    const selectedDayBookings = selectedDay
        ? getBookingsForDay(selectedDay.getDate())
        : []

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-500">جاري التحميل...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        التقويم
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        عرض وإدارة الحجوزات
                    </p>
                </div>

                {/* Hall Filter */}
                <div className="flex items-center gap-4">
                    <select
                        value={selectedHall}
                        onChange={(e) => setSelectedHall(e.target.value)}
                        className="form-input py-2 px-4 min-w-[200px]"
                    >
                        <option value="all">جميع القاعات</option>
                        {halls.map(hall => (
                            <option key={hall.id} value={hall.id}>{hall.name}</option>
                        ))}
                    </select>

                    <button onClick={goToToday} className="btn-secondary">
                        اليوم
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2">
                    <Card className="bg-white border border-[var(--border-color)]">
                        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[var(--border-color)]">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={nextMonth}
                                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <CardTitle className="text-xl">
                                    {ARABIC_MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </CardTitle>
                                <button
                                    onClick={prevMonth}
                                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                            </div>
                            <CalendarIcon className="text-[var(--primary-600)]" size={24} />
                        </CardHeader>

                        <CardContent className="pt-4">
                            {/* Days of Week Header */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {ARABIC_DAYS.map(day => (
                                    <div key={day} className="text-center text-sm font-semibold text-[var(--text-secondary)] py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((day, index) => {
                                    if (day === null) {
                                        return <div key={index} className="min-h-[80px]" />
                                    }

                                    const dayBookings = getBookingsForDay(day)
                                    const isSelected = selectedDay?.getDate() === day &&
                                        selectedDay?.getMonth() === currentDate.getMonth()

                                    return (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                                            className={`
                                                min-h-[80px] p-2 border rounded-md cursor-pointer transition-all
                                                ${isToday(day) ? 'border-[var(--primary-600)] border-2' : 'border-[var(--border-color)]'}
                                                ${isSelected ? 'bg-[var(--primary-50)]' : 'bg-white hover:bg-gray-50'}
                                                ${dayBookings.length > 0 ? 'ring-1 ring-[var(--primary-200)]' : ''}
                                            `}
                                        >
                                            <div className={`
                                                text-sm font-medium mb-1
                                                ${isToday(day) ? 'text-[var(--primary-600)]' : 'text-[var(--text-primary)]'}
                                            `}>
                                                {day}
                                            </div>

                                            {/* Booking indicators */}
                                            <div className="space-y-1">
                                                {dayBookings.slice(0, 2).map(booking => (
                                                    <div
                                                        key={booking.id}
                                                        className={`
                                                            text-xs px-1 py-0.5 rounded truncate
                                                            ${STATUS_COLORS[booking.status]?.bg || 'bg-gray-100'}
                                                            ${STATUS_COLORS[booking.status]?.text || 'text-gray-800'}
                                                        `}
                                                    >
                                                        {booking.hallName}
                                                    </div>
                                                ))}
                                                {dayBookings.length > 2 && (
                                                    <div className="text-xs text-[var(--primary-600)] font-medium">
                                                        +{dayBookings.length - 2} المزيد
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Selected Day Details */}
                <div className="lg:col-span-1">
                    <Card className="bg-white border border-[var(--border-color)] sticky top-4">
                        <CardHeader className="border-b border-[var(--border-color)]">
                            <CardTitle className="text-lg">
                                {selectedDay
                                    ? `${selectedDay.getDate()} ${ARABIC_MONTHS[selectedDay.getMonth()]}`
                                    : 'اختر يوماً'
                                }
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {!selectedDay ? (
                                <p className="text-[var(--text-secondary)] text-center py-8">
                                    اضغط على أي يوم لعرض الحجوزات
                                </p>
                            ) : selectedDayBookings.length === 0 ? (
                                <div className="text-center py-8">
                                    <CalendarIcon className="mx-auto text-gray-300 mb-3" size={48} />
                                    <p className="text-[var(--text-secondary)]">
                                        لا توجد حجوزات في هذا اليوم
                                    </p>
                                    <button className="btn-primary mt-4">
                                        + إضافة حجز
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selectedDayBookings.map(booking => (
                                        <div
                                            key={booking.id}
                                            className="p-4 border border-[var(--border-color)] rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            {/* Status Badge */}
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`
                                                    text-xs px-2 py-1 rounded-full font-medium
                                                    ${STATUS_COLORS[booking.status]?.bg || 'bg-gray-100'}
                                                    ${STATUS_COLORS[booking.status]?.text || 'text-gray-800'}
                                                `}>
                                                    {STATUS_COLORS[booking.status]?.label || booking.status}
                                                </span>
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    {booking.bookingNumber}
                                                </span>
                                            </div>

                                            {/* Hall Name */}
                                            <h4 className="font-semibold text-[var(--text-primary)] mb-2">
                                                {booking.hallName}
                                            </h4>

                                            {/* Details */}
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                                    <Users size={14} />
                                                    <span>{booking.customerName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                                    <Clock size={14} />
                                                    <span>{booking.startTime} - {booking.endTime}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                                    <CalendarIcon size={14} />
                                                    <span>{EVENT_TYPES[booking.eventType] || booking.eventType}</span>
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex justify-between items-center">
                                                <span className="text-sm text-[var(--text-secondary)]">المبلغ</span>
                                                <span className="font-bold text-[var(--primary-700)]">
                                                    {booking.finalAmount.toLocaleString()} ر.س
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Legend */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardContent className="py-4">
                    <div className="flex items-center justify-center gap-6 flex-wrap">
                        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
                            <div key={status} className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded ${colors.bg}`} />
                                <span className="text-sm text-[var(--text-secondary)]">{colors.label}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
