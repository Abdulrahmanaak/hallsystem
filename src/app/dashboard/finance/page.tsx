'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
    DollarSign,
    FileText,
    CreditCard,
    Plus,
    Search,
    Eye,
    Printer,
    X,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    RefreshCw,
    Link2,
    Trash2
} from 'lucide-react'

interface Invoice {
    id: string
    invoiceNumber: string
    bookingId: string
    bookingNumber: string
    hallName: string
    customerName: string
    customerPhone: string
    subtotal: number
    discountAmount: number
    vatAmount: number
    totalAmount: number
    paidAmount: number
    remainingAmount: number
    issueDate: string
    dueDate: string
    status: string
    syncedToQoyod: boolean
}

interface Payment {
    id: string
    paymentNumber: string
    bookingNumber: string
    customerName: string
    hallName: string
    invoiceNumber: string | null
    amount: number
    paymentMethod: string
    paymentDate: string
    notes: string | null
    syncedToQoyod: boolean
}

interface BookingForInvoice {
    id: string
    bookingNumber: string
    customerName: string
    hallName: string
    finalAmount: number
    status: string
}

const INVOICE_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    'UNPAID': { label: 'غير مدفوعة', color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> },
    'PARTIALLY_PAID': { label: 'مدفوعة جزئياً', color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={14} /> },
    'PAID': { label: 'مدفوعة', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
    'CANCELLED': { label: 'ملغاة', color: 'bg-gray-100 text-gray-800', icon: <AlertCircle size={14} /> }
}

const PAYMENT_METHODS: Record<string, string> = {
    'CASH': 'نقداً',
    'CARD': 'بطاقة',
    'BANK_TRANSFER': 'تحويل بنكي'
}

export default function FinancePage() {
    const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices')
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [payments, setPayments] = useState<Payment[]>([])
    const [bookings, setBookings] = useState<BookingForInvoice[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modals
    const [showInvoiceModal, setShowInvoiceModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showViewInvoice, setShowViewInvoice] = useState<Invoice | null>(null)
    const [showViewPayment, setShowViewPayment] = useState<Payment | null>(null)

    // Form data
    const [selectedBookingId, setSelectedBookingId] = useState('')
    const [paymentForm, setPaymentForm] = useState({
        bookingId: '',
        invoiceId: '',
        amount: '',
        paymentMethod: 'CASH',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
    })
    const [invoiceForm, setInvoiceForm] = useState({
        bookingId: '',
        amount: '',
        paymentMethod: 'CASH',
        notes: ''
    })
    const [saving, setSaving] = useState(false)

    const fetchData = async () => {
        try {
            const [invoicesRes, paymentsRes, bookingsRes] = await Promise.all([
                fetch('/api/invoices'),
                fetch('/api/payments'),
                fetch('/api/bookings')
            ])

            const [invoicesData, paymentsData, bookingsData] = await Promise.all([
                invoicesRes.json(),
                paymentsRes.json(),
                bookingsRes.json()
            ])

            setInvoices(invoicesData)
            setPayments(paymentsData)
            // Filter bookings that don't have invoices yet
            setBookings(bookingsData.filter((b: BookingForInvoice) => b.status === 'CONFIRMED'))
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Stats
    const stats = {
        totalInvoices: invoices.length,
        unpaidAmount: invoices
            .filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED')
            .reduce((sum, i) => sum + i.remainingAmount, 0),
        paidAmount: invoices.reduce((sum, i) => sum + i.paidAmount, 0),
        totalPayments: payments.length
    }

    // Filtered data
    const filteredInvoices = invoices.filter(i =>
        i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.customerName.includes(searchTerm) ||
        i.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const filteredPayments = payments.filter(p =>
        p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customerName.includes(searchTerm) ||
        p.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Create Invoice
    const handleCreateInvoice = async () => {
        if (!invoiceForm.bookingId || !invoiceForm.amount) return
        setSaving(true)

        try {
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: invoiceForm.bookingId,
                    amount: invoiceForm.amount,
                    paymentMethod: invoiceForm.paymentMethod,
                    notes: invoiceForm.notes
                })
            })

            if (response.ok) {
                setShowInvoiceModal(false)
                setInvoiceForm({ bookingId: '', amount: '', paymentMethod: 'CASH', notes: '' })
                setSelectedBookingId('')
                fetchData()
            } else {
                const error = await response.json()
                alert(error.error || 'حدث خطأ')
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setSaving(false)
        }
    }

    // Sync to Qoyod (with verification)
    const handleSyncToQoyod = async (type: 'invoice' | 'payment', id: string) => {
        setSaving(true)
        try {
            const response = await fetch('/api/qoyod', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, id })
            })

            const data = await response.json()

            if (response.ok) {
                // Show custom message from API if provided (e.g., "Invoice already exists, linked")
                if (data.message) {
                    alert(`${data.message}\nرقم الفاتورة في قيود: ${data.qoyodInvoiceId}`)
                } else if (type === 'invoice' && data.qoyodInvoiceId) {
                    alert(`تمت المزامنة مع قيود بنجاح\nرقم الفاتورة في قيود: ${data.qoyodInvoiceId}`)
                } else {
                    alert('تمت المزامنة مع قيود بنجاح')
                }
                fetchData()
            } else {
                alert(data.error || 'فشل المزامنة')
            }
        } catch (error) {
            console.error('Sync Error:', error)
            alert('حدث خطأ أثناء المزامنة')
        } finally {
            setSaving(false)
        }
    }

    // Verify and fix sync status for all invoices
    const handleVerifySync = async () => {
        if (!confirm('سيتم التحقق من حالة المزامنة لجميع الفواتير مع نظام قيود وتصحيح أي اختلافات. متابعة؟')) {
            return
        }

        setSaving(true)
        try {
            const response = await fetch('/api/qoyod?action=verify-sync')
            const data = await response.json()

            if (response.ok) {
                const { results, notFoundInvoices } = data
                let message = `تم التحقق من الفواتير:\n`
                message += `✓ تم التحقق: ${results.verified}\n`
                message += `🔧 تم إصلاح: ${results.fixed}\n`
                message += `⚠ غير موجودة في قيود: ${results.notFound}`

                if (notFoundInvoices && notFoundInvoices.length > 0) {
                    message += `\n\nالفواتير التي لم يتم العثور عليها:\n${notFoundInvoices.join(', ')}`
                }

                alert(message)
                fetchData()
            } else {
                alert(data.error || 'فشل التحقق')
            }
        } catch (error) {
            console.error('Verify Error:', error)
            alert('حدث خطأ أثناء التحقق')
        } finally {
            setSaving(false)
        }
    }

    // Delete invoice from Qoyod (only works for Draft invoices)
    const handleDeleteFromQoyod = async (id: string) => {
        if (!confirm('هل تريد حذف هذه الفاتورة من قيود؟ (يعمل فقط للفواتير بحالة مسودة)')) {
            return
        }

        setSaving(true)
        try {
            const response = await fetch('/api/qoyod', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'delete-invoice', id })
            })

            const data = await response.json()

            if (response.ok) {
                alert('تم حذف الفاتورة من قيود بنجاح')
                fetchData()
            } else {
                // If delete fails (invoice is approved), suggest cancellation
                if (data.error?.includes('ZATCA') || data.error?.includes('403')) {
                    alert('لا يمكن حذف فاتورة معتمدة. استخدم خيار "إلغاء الفاتورة" لإنشاء إشعار دائن.')
                } else {
                    alert(data.error || 'فشل حذف الفاتورة من قيود')
                }
            }
        } catch (error) {
            console.error('Delete Error:', error)
            alert('حدث خطأ أثناء الحذف من قيود')
        } finally {
            setSaving(false)
        }
    }

    // Cancel invoice with credit note (for approved invoices)
    const handleCancelInvoice = async (id: string) => {
        if (!confirm('هل تريد إلغاء هذه الفاتورة؟ سيتم إنشاء إشعار دائن في قيود لإلغاء الفاتورة.')) {
            return
        }

        setSaving(true)
        try {
            const response = await fetch('/api/qoyod', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'cancel-invoice', id })
            })

            const data = await response.json()

            if (response.ok) {
                alert(data.message || 'تم إلغاء الفاتورة وإنشاء إشعار دائن بنجاح')
                fetchData()
            } else {
                alert(data.error || 'فشل إلغاء الفاتورة')
            }
        } catch (error) {
            console.error('Cancel Error:', error)
            alert('حدث خطأ أثناء إلغاء الفاتورة')
        } finally {
            setSaving(false)
        }
    }

    // Delete local invoice (only for non-synced invoices)
    const handleDeleteLocalInvoice = async (id: string, invoiceNumber: string) => {
        if (!confirm(`هل تريد حذف الفاتورة ${invoiceNumber} من النظام؟\n\nملاحظة: هذا سيحذف الفاتورة من النظام المحلي فقط.`)) {
            return
        }

        setSaving(true)
        try {
            const response = await fetch(`/api/invoices/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                alert('تم حذف الفاتورة بنجاح')
                fetchData()
            } else {
                const data = await response.json()
                alert(data.error || 'فشل حذف الفاتورة')
            }
        } catch (error) {
            console.error('Delete Local Error:', error)
            alert('حدث خطأ أثناء حذف الفاتورة')
        } finally {
            setSaving(false)
        }
    }

    // Create Payment
    const handleCreatePayment = async () => {
        if (!paymentForm.bookingId || !paymentForm.amount) return
        setSaving(true)

        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentForm)
            })

            if (response.ok) {
                setShowPaymentModal(false)
                setPaymentForm({
                    bookingId: '',
                    invoiceId: '',
                    amount: '',
                    paymentMethod: 'CASH',
                    paymentDate: new Date().toISOString().split('T')[0],
                    notes: ''
                })
                fetchData()
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setSaving(false)
        }
    }

    // Print functions
    const printInvoice = (invoice: Invoice) => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>فاتورة ${invoice.invoiceNumber}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; direction: rtl; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 20px; }
                    .header h1 { color: #1e40af; margin: 0; font-size: 28px; }
                    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .info-block { }
                    .info-block h3 { color: #374151; margin-bottom: 10px; }
                    .info-block p { margin: 5px 0; color: #6b7280; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb; }
                    th { background: #f3f4f6; color: #374151; }
                    .totals { margin-top: 20px; }
                    .totals table { width: 300px; margin-right: auto; }
                    .totals td { border: none; padding: 8px 0; }
                    .totals .total-row { font-size: 18px; font-weight: bold; color: #1e40af; border-top: 2px solid #1e40af; }
                    .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>نظام إدارة القاعات</h1>
                    <p>فاتورة ضريبية</p>
                </div>
                
                <div class="invoice-info">
                    <div class="info-block">
                        <h3>معلومات الفاتورة</h3>
                        <p><strong>رقم الفاتورة:</strong> ${invoice.invoiceNumber}</p>
                        <p><strong>تاريخ الإصدار:</strong> ${new Date(invoice.issueDate).toLocaleDateString('ar-SA')}</p>
                        <p><strong>تاريخ الاستحقاق:</strong> ${new Date(invoice.dueDate).toLocaleDateString('ar-SA')}</p>
                    </div>
                    <div class="info-block">
                        <h3>معلومات العميل</h3>
                        <p><strong>الاسم:</strong> ${invoice.customerName}</p>
                        <p><strong>الهاتف:</strong> ${invoice.customerPhone}</p>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>البيان</th>
                            <th>القاعة</th>
                            <th>رقم الحجز</th>
                            <th>المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>حجز قاعة</td>
                            <td>${invoice.hallName}</td>
                            <td>${invoice.bookingNumber}</td>
                            <td>${invoice.subtotal.toLocaleString()} ر.س</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="totals">
                    <table>
                        <tr><td>المبلغ الإجمالي</td><td>${invoice.subtotal.toLocaleString()} ر.س</td></tr>
                        <tr><td>الخصم</td><td>${invoice.discountAmount.toLocaleString()} ر.س</td></tr>
                        <tr><td>ضريبة القيمة المضافة (15%)</td><td>${invoice.vatAmount.toLocaleString()} ر.س</td></tr>
                        <tr class="total-row"><td>الإجمالي النهائي</td><td>${invoice.totalAmount.toLocaleString()} ر.س</td></tr>
                    </table>
                </div>
                
                <div class="footer">
                    <p>شكراً لتعاملكم معنا</p>
                </div>
                
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `)
        printWindow.document.close()
    }

    const printReceipt = (payment: Payment) => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) return

        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>سند قبض ${payment.paymentNumber}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; direction: rtl; max-width: 400px; margin: auto; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e40af; padding-bottom: 15px; }
                    .header h1 { color: #1e40af; margin: 0; font-size: 22px; }
                    .header h2 { color: #374151; margin: 10px 0 0; font-size: 18px; }
                    .receipt-info { margin: 20px 0; }
                    .receipt-info p { margin: 10px 0; display: flex; justify-content: space-between; }
                    .receipt-info .label { color: #6b7280; }
                    .receipt-info .value { font-weight: bold; }
                    .amount-box { background: #eff6ff; border: 2px solid #1e40af; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                    .amount-box .label { color: #374151; font-size: 14px; }
                    .amount-box .amount { color: #1e40af; font-size: 28px; font-weight: bold; }
                    .footer { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 11px; }
                    .signature { margin-top: 40px; display: flex; justify-content: space-between; }
                    .signature div { text-align: center; }
                    .signature .line { border-top: 1px solid #9ca3af; width: 120px; margin-top: 40px; padding-top: 5px; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>نظام إدارة القاعات</h1>
                    <h2>سند قبض</h2>
                </div>
                
                <div class="receipt-info">
                    <p><span class="label">رقم السند:</span> <span class="value">${payment.paymentNumber}</span></p>
                    <p><span class="label">التاريخ:</span> <span class="value">${new Date(payment.paymentDate).toLocaleDateString('ar-SA')}</span></p>
                    <p><span class="label">اسم العميل:</span> <span class="value">${payment.customerName}</span></p>
                    <p><span class="label">رقم الحجز:</span> <span class="value">${payment.bookingNumber}</span></p>
                    <p><span class="label">القاعة:</span> <span class="value">${payment.hallName}</span></p>
                    <p><span class="label">طريقة الدفع:</span> <span class="value">${PAYMENT_METHODS[payment.paymentMethod] || payment.paymentMethod}</span></p>
                </div>
                
                <div class="amount-box">
                    <div class="label">المبلغ المستلم</div>
                    <div class="amount">${payment.amount.toLocaleString()} ر.س</div>
                </div>
                
                ${payment.notes ? `<p><strong>ملاحظات:</strong> ${payment.notes}</p>` : ''}
                
                <div class="signature">
                    <div><div class="line">توقيع المستلم</div></div>
                    <div><div class="line">توقيع المسلم</div></div>
                </div>
                
                <div class="footer">
                    <p>شكراً لتعاملكم معنا</p>
                </div>
                
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `)
        printWindow.document.close()
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
                        المالية
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        الفواتير والمدفوعات
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleVerifySync}
                        className="btn-secondary flex items-center gap-2"
                        disabled={saving}
                        title="التحقق من حالة المزامنة مع قيود"
                    >
                        <RefreshCw size={18} className={saving ? 'animate-spin' : ''} />
                        تحقق من المزامنة
                    </button>
                    <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        إصدار فاتورة
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--primary-50)] rounded-full">
                                <FileText className="text-[var(--primary-600)]" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">إجمالي الفواتير</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalInvoices}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 rounded-full">
                                <AlertCircle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">مستحقات غير مدفوعة</p>
                                <p className="text-2xl font-bold text-red-600">{stats.unpaidAmount.toLocaleString()} ر.س</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-full">
                                <DollarSign className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">المبالغ المحصلة</p>
                                <p className="text-2xl font-bold text-green-600">{stats.paidAmount.toLocaleString()} ر.س</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-full">
                                <CreditCard className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">عدد المدفوعات</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.totalPayments}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>



            {/* Search */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardContent className="py-4">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="بحث برقم الفاتورة أو العميل..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input pr-10 w-full"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Invoices List */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>رقم الفاتورة</th>
                                    <th>العميل</th>
                                    <th>الحجز</th>
                                    <th>المبلغ</th>
                                    <th>المدفوع</th>
                                    <th>الحالة</th>
                                    <th>قيود</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td className="font-medium text-[var(--primary-700)]">{invoice.invoiceNumber}</td>
                                        <td>{invoice.customerName}</td>
                                        <td>{invoice.bookingNumber}</td>
                                        <td className="font-bold">{invoice.totalAmount.toLocaleString()} ر.س</td>
                                        <td className="text-green-600">{invoice.paidAmount.toLocaleString()} ر.س</td>
                                        <td>
                                            <span className={`
                                                    inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                                                    ${INVOICE_STATUS[invoice.status]?.color || 'bg-gray-100 text-gray-700'}
                                                `}>
                                                {INVOICE_STATUS[invoice.status]?.icon}
                                                {INVOICE_STATUS[invoice.status]?.label || invoice.status}
                                            </span>
                                        </td>
                                        <td>
                                            {invoice.syncedToQoyod ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="inline-flex items-center gap-1 text-green-600" title="تمت المزامنة مع قيود">
                                                        <CheckCircle size={16} />
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteFromQoyod(invoice.id)}
                                                        className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                                                        title="حذف من قيود (مسودة فقط)"
                                                        disabled={saving}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelInvoice(invoice.id)}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                        title="إلغاء الفاتورة (إشعار دائن)"
                                                        disabled={saving}
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleSyncToQoyod('invoice', invoice.id)}
                                                    className="inline-flex items-center gap-1 text-yellow-600 hover:text-blue-600"
                                                    title="مزامنة مع قيود"
                                                    disabled={saving}
                                                >
                                                    <RefreshCw size={16} className={saving ? 'animate-spin' : ''} />
                                                    <span className="text-xs">مزامنة</span>
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => setShowViewInvoice(invoice)}
                                                    className="p-2 hover:bg-gray-100 rounded-md"
                                                    title="عرض"
                                                >
                                                    <Eye size={16} className="text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => printInvoice(invoice)}
                                                    className="p-2 hover:bg-gray-100 rounded-md"
                                                    title="طباعة"
                                                >
                                                    <Printer size={16} className="text-gray-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredInvoices.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <FileText className="text-gray-300 mb-4" size={64} />
                            <p className="text-[var(--text-secondary)]">لا توجد فواتير</p>
                        </div>
                    )}
                </CardContent>
            </Card>



            {/* Create Invoice Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                            <h3 className="text-lg font-bold">إصدار فاتورة جديدة</h3>
                            <button onClick={() => setShowInvoiceModal(false)} className="p-2 hover:bg-gray-100 rounded-md">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="form-label">اختر الحجز *</label>
                                <select
                                    value={invoiceForm.bookingId}
                                    onChange={(e) => {
                                        const bookingId = e.target.value
                                        const booking = bookings.find(b => b.id === bookingId)
                                        let amount = ''

                                        if (booking) {
                                            const bookingInvoices = invoices.filter(i => i.bookingId === bookingId && i.status !== 'CANCELLED')
                                            const invoicedAmount = bookingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
                                            const remaining = booking.finalAmount - invoicedAmount
                                            amount = remaining > 0 ? remaining.toString() : '0'
                                        }

                                        setInvoiceForm({ ...invoiceForm, bookingId, amount })
                                    }}
                                    className="form-input w-full"
                                >
                                    <option value="">اختر الحجز...</option>
                                    {bookings.map(booking => {
                                        const bookingInvoices = invoices.filter(i => i.bookingId === booking.id && i.status !== 'CANCELLED')
                                        const invoicedAmount = bookingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
                                        const remaining = booking.finalAmount - invoicedAmount

                                        if (remaining <= 0) return null // Hide fully invoiced bookings

                                        return (
                                            <option key={booking.id} value={booking.id}>
                                                {booking.bookingNumber} - {booking.customerName} (المتبقي: {remaining.toLocaleString()})
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="form-label">المبلغ *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="0.01"
                                    value={invoiceForm.amount}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="form-label">طريقة الدفع *</label>
                                <select
                                    value={invoiceForm.paymentMethod}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentMethod: e.target.value })}
                                    className="form-input w-full"
                                >
                                    <option value="CASH">نقداً</option>
                                    <option value="CARD">بطاقة</option>
                                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">ملاحظات</label>
                                <textarea
                                    value={invoiceForm.notes}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                                    className="form-input w-full h-20"
                                    placeholder="ملاحظات إضافية..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCreateInvoice}
                                    disabled={saving || !invoiceForm.bookingId || !invoiceForm.amount}
                                    className="btn-primary flex-1"
                                >
                                    {saving ? 'جاري الإصدار...' : 'إصدار الفاتورة'}
                                </button>
                                <button
                                    onClick={() => setShowInvoiceModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                            <h3 className="text-lg font-bold">تسجيل دفعة جديدة</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-md">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="form-label">الفاتورة *</label>
                                <select
                                    value={paymentForm.invoiceId}
                                    onChange={(e) => {
                                        const inv = invoices.find(i => i.id === e.target.value)
                                        setPaymentForm({
                                            ...paymentForm,
                                            invoiceId: e.target.value,
                                            bookingId: inv?.bookingNumber ? bookings.find(b => b.bookingNumber === inv.bookingNumber)?.id || '' : '',
                                            amount: inv?.remainingAmount.toString() || ''
                                        })
                                    }}
                                    className="form-input w-full"
                                >
                                    <option value="">اختر فاتورة</option>
                                    {invoices.filter(i => i.status !== 'PAID' && i.status !== 'CANCELLED').map(i => (
                                        <option key={i.id} value={i.id}>
                                            {i.invoiceNumber} - {i.customerName} (متبقي: {i.remainingAmount.toLocaleString()} ر.س)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="form-label">المبلغ (ر.س) *</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="form-label">طريقة الدفع</label>
                                <select
                                    value={paymentForm.paymentMethod}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                    className="form-input w-full"
                                >
                                    <option value="CASH">نقداً</option>
                                    <option value="CARD">بطاقة</option>
                                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">تاريخ الدفع</label>
                                <input
                                    type="date"
                                    value={paymentForm.paymentDate}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                    className="form-input w-full"
                                />
                            </div>

                            <div>
                                <label className="form-label">ملاحظات</label>
                                <textarea
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                    className="form-input w-full"
                                    rows={2}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCreatePayment}
                                    disabled={!paymentForm.amount || saving}
                                    className="btn-primary flex-1"
                                >
                                    {saving ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
                                </button>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Invoice Modal */}
            {showViewInvoice && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                            <h3 className="text-lg font-bold">تفاصيل الفاتورة</h3>
                            <button onClick={() => setShowViewInvoice(null)} className="p-2 hover:bg-gray-100 rounded-md">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-2xl font-bold text-[var(--primary-700)]">{showViewInvoice.invoiceNumber}</span>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${INVOICE_STATUS[showViewInvoice.status]?.color}`}>
                                    {INVOICE_STATUS[showViewInvoice.status]?.icon}
                                    {INVOICE_STATUS[showViewInvoice.status]?.label}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-[var(--text-muted)]">العميل:</span> <strong>{showViewInvoice.customerName}</strong></div>
                                <div><span className="text-[var(--text-muted)]">رقم الحجز:</span> <strong>{showViewInvoice.bookingNumber}</strong></div>
                                <div><span className="text-[var(--text-muted)]">القاعة:</span> <strong>{showViewInvoice.hallName}</strong></div>
                                <div><span className="text-[var(--text-muted)]">تاريخ الإصدار:</span> <strong>{new Date(showViewInvoice.issueDate).toLocaleDateString('ar-SA')}</strong></div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between"><span>المبلغ</span><span>{showViewInvoice.subtotal.toLocaleString()} ر.س</span></div>
                                <div className="flex justify-between text-red-600"><span>الخصم</span><span>-{showViewInvoice.discountAmount.toLocaleString()} ر.س</span></div>
                                <div className="flex justify-between"><span>الضريبة (15%)</span><span>{showViewInvoice.vatAmount.toLocaleString()} ر.س</span></div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>الإجمالي</span><span>{showViewInvoice.totalAmount.toLocaleString()} ر.س</span></div>
                                <div className="flex justify-between text-green-600"><span>المدفوع</span><span>{showViewInvoice.paidAmount.toLocaleString()} ر.س</span></div>
                                <div className="flex justify-between font-bold text-red-600"><span>المتبقي</span><span>{showViewInvoice.remainingAmount.toLocaleString()} ر.س</span></div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => printInvoice(showViewInvoice)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    <Printer size={18} />
                                    طباعة
                                </button>
                                <button onClick={() => setShowViewInvoice(null)} className="btn-secondary flex-1">إغلاق</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Payment Modal */}
            {showViewPayment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                            <h3 className="text-lg font-bold">تفاصيل سند القبض</h3>
                            <button onClick={() => setShowViewPayment(null)} className="p-2 hover:bg-gray-100 rounded-md">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="text-center">
                                <span className="text-2xl font-bold text-[var(--primary-700)]">{showViewPayment.paymentNumber}</span>
                            </div>

                            <div className="bg-[var(--primary-50)] p-6 rounded-lg text-center">
                                <p className="text-sm text-[var(--text-secondary)]">المبلغ المستلم</p>
                                <p className="text-3xl font-bold text-[var(--primary-700)]">{showViewPayment.amount.toLocaleString()} ر.س</p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-[var(--text-muted)]">العميل:</span><strong>{showViewPayment.customerName}</strong></div>
                                <div className="flex justify-between"><span className="text-[var(--text-muted)]">رقم الحجز:</span><strong>{showViewPayment.bookingNumber}</strong></div>
                                <div className="flex justify-between"><span className="text-[var(--text-muted)]">طريقة الدفع:</span><strong>{PAYMENT_METHODS[showViewPayment.paymentMethod]}</strong></div>
                                <div className="flex justify-between"><span className="text-[var(--text-muted)]">التاريخ:</span><strong>{new Date(showViewPayment.paymentDate).toLocaleDateString('ar-SA')}</strong></div>
                            </div>

                            {showViewPayment.notes && (
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-[var(--text-muted)]">ملاحظات</p>
                                    <p>{showViewPayment.notes}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => printReceipt(showViewPayment)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    <Printer size={18} />
                                    طباعة سند القبض
                                </button>
                                <button onClick={() => setShowViewPayment(null)} className="btn-secondary flex-1">إغلاق</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
