'use client'

// Helper to format date to Hijri
const formatHijri = (dateString: string) => {
    if (!dateString) return ''
    try {
        return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(new Date(dateString))
    } catch (e) {
        return ''
    }
}

// Format a Date object to YYYY-MM-DD
const toGregorianString = (date: Date) => date.toISOString().split('T')[0]

// Get Hijri components from a Date object
const getHijriDate = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    })
    const parts = formatter.formatToParts(date)
    const day = parts.find(p => p.type === 'day')?.value || ''
    const month = parts.find(p => p.type === 'month')?.value || ''
    const year = parts.find(p => p.type === 'year')?.value || ''
    return { day, month, year }
}

// Approximate Gregorian from Hijri (Brute-force search around a pivot year)
const findGregorianFromHijri = (hYear: string, hMonth: string, hDay: string) => {
    if (!hYear || !hMonth || !hDay) return null;
    const targetYear = parseInt(hYear);
    const approxGregYear = Math.floor(targetYear * 0.97 + 622);
    const startDate = new Date(approxGregYear - 1, 0, 1);
    const endDate = new Date(approxGregYear + 1, 11, 31);
    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        const h = getHijriDate(d);
        if (h.year === hYear && h.month === hMonth && h.day === hDay) {
            return new Date(d);
        }
    }
    return null;
}


import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
    Calendar,
    Plus,
    Search,
    Filter,
    Eye,
    Edit2,
    Trash2,
    X,
    Clock,
    Users,
    Building2,
    DollarSign,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronDown,
    FileText,
    CalendarIcon
} from 'lucide-react'

interface Booking {
    id: string
    bookingNumber: string
    customerId: string
    customerName: string
    customerPhone: string
    customerEmail?: string
    customerIdNumber?: string
    hallId: string
    hallName: string
    eventType: string
    date: string
    startTime: string
    endTime: string
    guestCount: number | null
    status: string
    totalAmount: number
    discountAmount: number
    downPayment: number
    vatAmount: number
    finalAmount: number
    notes: string | null
    createdAt: string
    coffeeServers?: number
    sacrifices?: number
    waterCartons?: number
    sectionType?: string
    mealType?: string
}

interface Customer {
    id: string
    nameAr: string
    phone: string
}

interface Hall {
    id: string
    name: string
    basePrice: number
    capacity: number
}

const EVENT_TYPES: Record<string, string> = {
    'WEDDING': 'زفاف',
    'ENGAGEMENT': 'خطوبة',

    'CONFERENCE': 'مؤتمر',
    'GRADUATION': 'تخرج',
    'OTHER': 'أخرى'
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    'PENDING': { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle size={14} /> },
    'CONFIRMED': { label: 'مؤكد', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
    'CANCELLED': { label: 'ملغي', color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> },
    'COMPLETED': { label: 'مكتمل', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle size={14} /> }
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [halls, setHalls] = useState<Hall[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showModal, setShowModal] = useState(false)
    const [showViewModal, setShowViewModal] = useState(false)
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
    const [viewingBooking, setViewingBooking] = useState<Booking | null>(null)
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerIdNumber: '',
        hallId: '',
        eventType: 'WEDDING',
        eventDate: '',
        guestCount: '',
        sectionType: 'both',
        coffeeServers: '0',
        sacrifices: '0',
        waterCartons: '0',
        totalAmount: '',
        discountAmount: '0',
        downPayment: '0',
        notes: ''
    })
    const [saving, setSaving] = useState(false)
    const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null)
    const [hijriDate, setHijriDate] = useState({ day: '', month: '', year: '' })

    const fetchData = async () => {
        try {
            const [bookingsRes, customersRes, hallsRes] = await Promise.all([
                fetch('/api/bookings'),
                fetch('/api/customers'),
                fetch('/api/halls')
            ])

            const [bookingsData, customersData, hallsData] = await Promise.all([
                bookingsRes.json(),
                customersRes.json(),
                hallsRes.json()
            ])

            setBookings(bookingsData)
            setCustomers(customersData)
            setHalls(hallsData)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredBookings = bookings.filter(b => {
        const matchesSearch =
            b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.hallName.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || b.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const openAddModal = () => {
        setEditingBooking(null)
        setFormData({
            customerName: '',
            customerPhone: '',
            customerIdNumber: '',
            hallId: '',
            eventType: 'WEDDING',
            eventDate: new Date().toISOString().split('T')[0],
            guestCount: '',
            sectionType: 'both',
            coffeeServers: '0',
            sacrifices: '0',
            waterCartons: '0',
            totalAmount: '',
            discountAmount: '0',
            downPayment: '0',
            notes: ''
        })
        setHijriDate(getHijriDate(new Date()))
        setShowModal(true)
    }

    const openEditModal = (booking: Booking) => {
        setEditingBooking(booking)
        setFormData({
            customerName: booking.customerName || '',
            customerPhone: booking.customerPhone || '',
            customerIdNumber: booking.customerIdNumber || '',
            hallId: booking.hallId,
            eventType: booking.eventType,
            eventDate: booking.date,
            guestCount: booking.guestCount?.toString() || '',
            sectionType: booking.sectionType || 'both',
            coffeeServers: booking.coffeeServers?.toString() || '0',
            sacrifices: booking.sacrifices?.toString() || '0',
            waterCartons: booking.waterCartons?.toString() || '0',
            totalAmount: booking.totalAmount.toString(),
            discountAmount: booking.discountAmount.toString(),
            downPayment: booking.downPayment?.toString() || '0',
            notes: booking.notes || ''
        })
        if (booking.date) {
            setHijriDate(getHijriDate(new Date(booking.date)))
        }
        setShowModal(true)
    }

    const openViewModal = (booking: Booking) => {
        setViewingBooking(booking)
        setShowViewModal(true)
    }

    const handleHallChange = (hallId: string) => {
        const hall = halls.find(h => h.id === hallId)
        setFormData({
            ...formData,
            hallId,
            totalAmount: hall?.basePrice.toString() || formData.totalAmount
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const url = editingBooking
                ? `/api/bookings/${editingBooking.id}`
                : '/api/bookings'

            const method = editingBooking ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                setShowModal(false)
                fetchData()
            }
        } catch (error) {
            console.error('Error saving booking:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleStatusChange = async (booking: Booking, newStatus: string) => {
        try {
            const response = await fetch(`/api/bookings/${booking.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    fromStatus: booking.status
                })
            })

            if (response.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من إلغاء هذا الحجز؟')) return

        try {
            const response = await fetch(`/api/bookings/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('Error deleting booking:', error)
        }
    }

    // Stats
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'PENDING').length,
        confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
        totalRevenue: bookings
            .filter(b => b.status !== 'CANCELLED')
            .reduce((sum, b) => sum + b.finalAmount, 0)
    }

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
                        الحجوزات
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        إدارة جميع الحجوزات
                    </p>
                </div>

                <Link href="/dashboard/bookings/new" className="btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    حجز جديد
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--primary-50)] rounded-full">
                                <Calendar className="text-[var(--primary-600)]" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">إجمالي الحجوزات</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-50 rounded-full">
                                <AlertCircle className="text-yellow-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">قيد الانتظار</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-full">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">مؤكدة</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.confirmed}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-full">
                                <DollarSign className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">إجمالي الإيرادات</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">
                                    {stats.totalRevenue.toLocaleString()} ر.س
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="بحث برقم الحجز أو اسم العميل أو القاعة..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-input pr-10 w-full"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="form-input w-full md:w-48"
                        >
                            <option value="all">جميع الحالات</option>
                            <option value="PENDING">قيد الانتظار</option>
                            <option value="CONFIRMED">مؤكد</option>
                            <option value="COMPLETED">مكتمل</option>
                            <option value="CANCELLED">ملغي</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Bookings Table */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>رقم الحجز</th>
                                    <th>العميل</th>
                                    <th>القاعة</th>
                                    <th>التاريخ</th>
                                    <th>الحالة</th>
                                    <th>المبلغ</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map(booking => (
                                    <tr key={booking.id}>
                                        <td className="font-medium text-[var(--primary-700)]">
                                            {booking.bookingNumber}
                                        </td>
                                        <td>
                                            <div>{booking.customerName}</div>
                                            <div className="text-xs text-[var(--text-muted)]" dir="ltr">
                                                {booking.customerPhone}
                                            </div>
                                        </td>
                                        <td>{booking.hallName}</td>
                                        <td>{new Date(booking.date).toLocaleDateString('ar-SA')}</td>
                                        <td>
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenStatusDropdown(openStatusDropdown === booking.id ? null : booking.id)}
                                                    className={`
                                                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer
                                                        ${STATUS_CONFIG[booking.status]?.color || 'bg-gray-100 text-gray-700'}
                                                    `}
                                                >
                                                    {STATUS_CONFIG[booking.status]?.icon}
                                                    {STATUS_CONFIG[booking.status]?.label || booking.status}
                                                    <ChevronDown size={12} />
                                                </button>

                                                {/* Status Dropdown */}
                                                {openStatusDropdown === booking.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setOpenStatusDropdown(null)}
                                                        />
                                                        <div className="absolute top-full right-0 mt-1 bg-white border border-[var(--border-color)] rounded-md shadow-lg z-20 min-w-[140px]">
                                                            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                                                <button
                                                                    key={status}
                                                                    onClick={() => {
                                                                        handleStatusChange(booking, status)
                                                                        setOpenStatusDropdown(null)
                                                                    }}
                                                                    className={`
                                                                        w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50
                                                                        ${booking.status === status ? 'bg-gray-100' : ''}
                                                                    `}
                                                                >
                                                                    {config.icon}
                                                                    {config.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="font-bold">
                                            {(booking.totalAmount - booking.discountAmount).toLocaleString()} ر.س
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openViewModal(booking)}
                                                    className="p-2 hover:bg-gray-100 rounded-md"
                                                    title="عرض"
                                                >
                                                    <Eye size={16} className="text-gray-500" />
                                                </button>
                                                <Link
                                                    href={`/dashboard/bookings/${booking.id}/contract`}
                                                    className="p-2 hover:bg-blue-50 rounded-md"
                                                    title="طباعة العقد"
                                                >
                                                    <FileText size={16} className="text-blue-600" />
                                                </Link>
                                                <button
                                                    onClick={() => openEditModal(booking)}
                                                    className="p-2 hover:bg-gray-100 rounded-md"
                                                    title="تعديل"
                                                >
                                                    <Edit2 size={16} className="text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(booking.id)}
                                                    className="p-2 hover:bg-red-50 rounded-md"
                                                    title="إلغاء"
                                                >
                                                    <Trash2 size={16} className="text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredBookings.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Calendar className="text-gray-300 mb-4" size={64} />
                            <p className="text-[var(--text-secondary)]">
                                {searchTerm || statusFilter !== 'all' ? 'لا توجد نتائج' : 'لا توجد حجوزات بعد'}
                            </p>
                            {!searchTerm && statusFilter === 'all' && (
                                <Link href="/dashboard/bookings/new" className="btn-primary mt-4 inline-block">
                                    إضافة أول حجز
                                </Link>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                            <h3 className="text-lg font-bold">
                                {editingBooking ? 'تعديل الحجز' : 'حجز جديد'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-md"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Booking Number & Status (for edit mode) */}
                            {editingBooking && (
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-[var(--primary-700)]">
                                        {editingBooking.bookingNumber}
                                    </span>
                                    <span className={`
                                        inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                                        ${STATUS_CONFIG[editingBooking.status]?.color}
                                    `}>
                                        {STATUS_CONFIG[editingBooking.status]?.icon}
                                        {STATUS_CONFIG[editingBooking.status]?.label}
                                    </span>
                                </div>
                            )}

                            {/* Customer Details Section */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="text-[var(--primary-600)]" size={18} />
                                    <span className="font-medium text-[var(--primary-700)]">بيانات العميل</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] mb-1">رقم الجوال *</p>
                                        <input
                                            required
                                            type="tel"
                                            dir="ltr"
                                            placeholder="05xxxxxxxx"
                                            value={formData.customerPhone}
                                            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                            className="form-input w-full text-right"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] mb-1">رقم الهوية / السجل</p>
                                        <input
                                            type="text"
                                            placeholder="10xxxxxxxx"
                                            value={formData.customerIdNumber}
                                            onChange={(e) => setFormData({ ...formData, customerIdNumber: e.target.value })}
                                            className="form-input w-full"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)] mb-1">اسم العميل *</p>
                                        <input
                                            required
                                            type="text"
                                            placeholder="الاسم الثلاثي"
                                            value={formData.customerName}
                                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                            className="form-input w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Hall Details Section - 4 column grid */}
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                <div className="grid grid-cols-4 gap-3 text-sm text-right">
                                    <div>
                                        <div className="flex items-center gap-1 text-xs text-purple-600 mb-1">
                                            <Building2 size={14} />
                                            <span>القاعة *</span>
                                        </div>
                                        <select
                                            required
                                            value={formData.hallId}
                                            onChange={(e) => handleHallChange(e.target.value)}
                                            className="form-input w-full text-sm"
                                        >
                                            <option value="">اختر</option>
                                            {halls.map(h => (
                                                <option key={h.id} value={h.id}>{h.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">السعة</p>
                                        <p className="font-medium mt-2">{halls.find(h => h.id === formData.hallId)?.capacity || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">القسم</p>
                                        <select
                                            value={formData.sectionType}
                                            onChange={(e) => setFormData({ ...formData, sectionType: e.target.value })}
                                            className="form-input w-full text-sm"
                                        >
                                            <option value="men">رجال</option>
                                            <option value="women">نساء</option>
                                            <option value="both">قسمين</option>
                                        </select>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">نوع المناسبة *</p>
                                        <select
                                            required
                                            value={formData.eventType}
                                            onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                                            className="form-input w-full text-sm"
                                        >
                                            {Object.entries(EVENT_TYPES).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Date Section - single row layout */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-4 text-sm flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="text-[var(--primary-600)]" size={16} />
                                        <span className="font-medium text-[var(--primary-700)]">تاريخ المناسبة *</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">ميلادي</span>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "justify-start text-left font-normal bg-white h-8 px-3",
                                                        !formData.eventDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formData.eventDate ? new Date(formData.eventDate).toLocaleDateString('en-GB') : <span>اختر</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="gregorian"
                                                    selected={formData.eventDate ? new Date(formData.eventDate) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            const val = toGregorianString(date);
                                                            setFormData({ ...formData, eventDate: val });
                                                            setHijriDate(getHijriDate(date));
                                                        }
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">هجري</span>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "justify-start text-left font-normal bg-white h-8 px-3",
                                                        (!hijriDate.day) && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {hijriDate.day && hijriDate.month && hijriDate.year
                                                        ? `${hijriDate.day} / ${hijriDate.month} / ${hijriDate.year}`
                                                        : <span>اختر</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="hijri"
                                                    selected={formData.eventDate ? new Date(formData.eventDate) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            const val = toGregorianString(date);
                                                            setFormData({ ...formData, eventDate: val });
                                                            setHijriDate(getHijriDate(date));
                                                        }
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>


                            {/* Services Section - display only */}
                            {(formData.coffeeServers || formData.sacrifices || formData.waterCartons) && (
                                <div className="bg-purple-50 p-3 rounded-lg">
                                    <p className="text-xs text-purple-600 font-medium mb-2">الخدمات الإضافية</p>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        {(parseInt(formData.coffeeServers) || 0) > 0 && (
                                            <div>
                                                <span className="text-[var(--text-muted)]">صبابين: </span>
                                                <span className="font-medium">{formData.coffeeServers}</span>
                                            </div>
                                        )}
                                        {(parseInt(formData.sacrifices) || 0) > 0 && (
                                            <div>
                                                <span className="text-[var(--text-muted)]">ذبائح: </span>
                                                <span className="font-medium">{formData.sacrifices}</span>
                                            </div>
                                        )}
                                        {(parseInt(formData.waterCartons) || 0) > 0 && (
                                            <div>
                                                <span className="text-[var(--text-muted)]">كراتين ماء: </span>
                                                <span className="font-medium">{formData.waterCartons}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Cost Summary Section - compact */}
                            <div className="border border-[var(--primary-200)] bg-[var(--primary-50)/30] p-3 rounded-lg">
                                <p className="text-xs font-medium text-[var(--primary-700)] mb-2">ملخص التكاليف</p>

                                {/* Price Row */}
                                <div className="flex justify-between items-center font-semibold text-sm pb-2 border-b border-slate-200">
                                    <span>السعر *</span>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.totalAmount}
                                        onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                        className="form-input w-32 text-left"
                                        placeholder="0"
                                    />
                                </div>

                                {/* Details */}
                                <div className="space-y-1 py-2 border-b border-dashed border-slate-300 text-xs">
                                    <div className="flex justify-between items-center text-red-600">
                                        <span>الخصم</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.discountAmount}
                                            onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                                            className="form-input w-28 text-left text-red-600"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>ض.ق.م (15%)</span>
                                        <span>{Math.round((parseFloat(formData.totalAmount || '0') - parseFloat(formData.discountAmount || '0')) * (15 / 115)).toLocaleString()} ر.س</span>
                                    </div>
                                    <div className="flex justify-between items-center text-green-600">
                                        <span>العربون</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.downPayment}
                                            onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                                            className="form-input w-28 text-left text-green-600"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Remaining Amount - Highlighted */}
                                <div className="bg-[var(--primary-700)] text-white p-2 rounded-lg mt-2">
                                    <div className="flex justify-between text-base font-bold">
                                        <span>المتبقي</span>
                                        <span>{(parseFloat(formData.totalAmount || '0') - parseFloat(formData.discountAmount || '0') - parseFloat(formData.downPayment || '0')).toLocaleString()} ر.س</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary flex-1"
                                >
                                    {saving ? 'جاري الحفظ...' : (editingBooking ? 'حفظ التعديلات' : 'إنشاء الحجز')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && viewingBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                            <h3 className="text-lg font-bold">
                                تفاصيل الحجز
                            </h3>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-md"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-[var(--primary-700)]">
                                    {viewingBooking.bookingNumber}
                                </span>
                                <span className={`
                                    inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                                    ${STATUS_CONFIG[viewingBooking.status]?.color}
                                `}>
                                    {STATUS_CONFIG[viewingBooking.status]?.icon}
                                    {STATUS_CONFIG[viewingBooking.status]?.label}
                                </span>
                            </div>

                            {/* Customer Details Section - matches new booking form layout */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="text-[var(--primary-600)]" size={18} />
                                    <span className="font-medium text-[var(--primary-700)]">بيانات العميل</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">رقم الجوال</p>
                                        <p className="font-medium" dir="ltr">{viewingBooking.customerPhone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">رقم الهوية / السجل</p>
                                        <p className="font-medium">{viewingBooking.customerIdNumber || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--text-muted)]">اسم العميل</p>
                                        <p className="font-medium">{viewingBooking.customerName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Hall Details Section - 4 column grid */}
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                                <div className="grid grid-cols-4 gap-3 text-sm text-right">
                                    <div>
                                        <div className="flex items-center gap-1 text-xs text-purple-600">
                                            <Building2 size={14} />
                                            <span>القاعة</span>
                                        </div>
                                        <p className="font-semibold text-purple-800 mt-1">{viewingBooking.hallName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">السعة</p>
                                        <p className="font-medium mt-1">{halls.find(h => h.id === viewingBooking.hallId)?.capacity || viewingBooking.guestCount || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">القسم</p>
                                        <p className="font-medium mt-1">
                                            {viewingBooking.sectionType === 'men' ? 'رجال' :
                                                viewingBooking.sectionType === 'women' ? 'نساء' :
                                                    viewingBooking.sectionType === 'both' ? 'قسمين' : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">نوع المناسبة</p>
                                        <p className="font-medium mt-1">{EVENT_TYPES[viewingBooking.eventType] || viewingBooking.eventType}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Date Section - single row layout */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="text-[var(--primary-600)]" size={16} />
                                        <span className="font-medium text-[var(--primary-700)]">تاريخ المناسبة</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">ميلادي</span>
                                        <span className="font-medium bg-white px-3 py-1 rounded border border-slate-200">
                                            {new Date(viewingBooking.date).toLocaleDateString('en-GB')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">هجري</span>
                                        <span className="font-medium bg-white px-3 py-1 rounded border border-slate-200">
                                            {formatHijri(viewingBooking.date)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Services Section */}
                            {(viewingBooking.coffeeServers || viewingBooking.sacrifices || viewingBooking.waterCartons) && (
                                <div className="bg-purple-50 p-3 rounded-lg">
                                    <p className="text-xs text-purple-600 font-medium mb-2">الخدمات الإضافية</p>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        {(viewingBooking.coffeeServers || 0) > 0 && (
                                            <div>
                                                <span className="text-[var(--text-muted)]">صبابين: </span>
                                                <span className="font-medium">{viewingBooking.coffeeServers}</span>
                                            </div>
                                        )}
                                        {(viewingBooking.sacrifices || 0) > 0 && (
                                            <div>
                                                <span className="text-[var(--text-muted)]">ذبائح: </span>
                                                <span className="font-medium">{viewingBooking.sacrifices}</span>
                                            </div>
                                        )}
                                        {(viewingBooking.waterCartons || 0) > 0 && (
                                            <div>
                                                <span className="text-[var(--text-muted)]">كراتين ماء: </span>
                                                <span className="font-medium">{viewingBooking.waterCartons}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Cost Summary Section - compact */}
                            <div className="border border-[var(--primary-200)] bg-[var(--primary-50)/30] p-3 rounded-lg">
                                <p className="text-xs font-medium text-[var(--primary-700)] mb-2">ملخص التكاليف</p>

                                {/* Price Row */}
                                <div className="flex justify-between font-semibold text-sm pb-2 border-b border-slate-200">
                                    <span>السعر</span>
                                    <span>{viewingBooking.totalAmount.toLocaleString()} ر.س</span>
                                </div>

                                {/* Details */}
                                <div className="space-y-1 py-2 border-b border-dashed border-slate-300 text-xs">
                                    {viewingBooking.discountAmount > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>الخصم</span>
                                            <span>-{viewingBooking.discountAmount.toLocaleString()} ر.س</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-slate-600">
                                        <span>ض.ق.م (15%)</span>
                                        <span>{viewingBooking.vatAmount.toLocaleString()} ر.س</span>
                                    </div>
                                    {(viewingBooking.downPayment || 0) > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>العربون</span>
                                            <span>-{(viewingBooking.downPayment || 0).toLocaleString()} ر.س</span>
                                        </div>
                                    )}
                                </div>

                                {/* Remaining Amount - Highlighted */}
                                <div className="bg-[var(--primary-700)] text-white p-2 rounded-lg mt-2">
                                    <div className="flex justify-between text-base font-bold">
                                        <span>المتبقي</span>
                                        <span>{(viewingBooking.totalAmount - viewingBooking.discountAmount - (viewingBooking.downPayment || 0)).toLocaleString()} ر.س</span>
                                    </div>
                                </div>
                            </div>

                            {viewingBooking.notes && (
                                <div>
                                    <p className="text-sm text-[var(--text-muted)] mb-1">ملاحظات</p>
                                    <p className="text-sm bg-gray-50 p-3 rounded">{viewingBooking.notes}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowViewModal(false)
                                        openEditModal(viewingBooking)
                                    }}
                                    className="btn-primary flex-1"
                                >
                                    تعديل
                                </button>
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
