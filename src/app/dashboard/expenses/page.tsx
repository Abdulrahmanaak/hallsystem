'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
    DollarSign,
    FileText,
    Plus,
    Search,
    Eye,
    X,
    Image as ImageIcon,
    Calendar,
    Loader2,
    Trash2,
    RefreshCw,
    CheckCircle2
} from 'lucide-react'

interface Expense {
    id: string
    amount: number
    description: string
    expenseDate: string
    category: string | null
    imageUrl: string | null
    syncedToQoyod: boolean
    vendor?: {
        id: string
        nameAr: string
    } | null
    createdBy: {
        nameAr: string
        username: string
    }
}

interface Vendor {
    id: string
    nameAr: string
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [loading, setLoading] = useState(true)
    const [syncingVendors, setSyncingVendors] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [vendorSearch, setVendorSearch] = useState('')
    const [showVendorDropdown, setShowVendorDropdown] = useState(false)

    // Modal
    const [showModal, setShowModal] = useState(false)
    const [viewImage, setViewImage] = useState<string | null>(null)

    // Form data
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0],
        category: '',
        vendorId: '',
        file: null as File | null
    })
    const [saving, setSaving] = useState(false)

    const fetchData = async () => {
        try {
            const res = await fetch('/api/expenses')
            const data = await res.json()
            setExpenses(data)
        } catch (error) {
            console.error('Error fetching expenses:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/vendors')
            const data = await res.json()
            if (Array.isArray(data)) setVendors(data)
        } catch (error) {
            console.error('Error fetching vendors:', error)
        }
    }

    const syncVendors = async () => {
        setSyncingVendors(true)
        try {
            const res = await fetch('/api/vendors/sync', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                alert(data.message || 'تم مزامنة الموردين')
                fetchVendors()
            } else {
                alert(data.error || 'فشل مزامنة الموردين')
            }
        } catch (error) {
            console.error('Error syncing vendors:', error)
            alert('حدث خطأ في مزامنة الموردين')
        } finally {
            setSyncingVendors(false)
        }
    }

    useEffect(() => {
        fetchData()
        fetchVendors()
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, file: e.target.files[0] })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            let imageUrl = null

            // 1. Upload file if exists
            if (formData.file) {
                const uploadFormData = new FormData()
                uploadFormData.append('file', formData.file)

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData
                })

                if (!uploadRes.ok) {
                    throw new Error('Upload failed')
                }

                const uploadData = await uploadRes.json()
                imageUrl = uploadData.url
            }

            // 2. Create expense
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(formData.amount),
                    description: formData.description,
                    expenseDate: formData.expenseDate,
                    category: formData.category,
                    vendorId: formData.vendorId || null,
                    imageUrl
                })
            })

            if (res.ok) {
                setShowModal(false)
                setFormData({
                    amount: '',
                    description: '',
                    expenseDate: new Date().toISOString().split('T')[0],
                    category: '',
                    vendorId: '',
                    file: null
                })
                setVendorSearch('')
                fetchData()
            }
        } catch (error) {
            console.error('Error saving expense:', error)
            alert('حدث خطأ أثناء حفظ المصروف')
        } finally {
            setSaving(false)
        }
    }

    const filteredExpenses = expenses.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.category && e.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const totalStats = {
        count: expenses.length,
        amount: expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-gray-500" size={32} />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        المصروفات
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        إدارة المصروفات والفواتير
                    </p>
                </div>

                <button
                    id="tour-add-expense-btn"
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={18} />
                    تسجيل مصروف
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--primary-50)] rounded-full">
                                <FileText className="text-[var(--primary-600)]" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">عدد المصروفات</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{totalStats.count}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 rounded-full">
                                <DollarSign className="text-red-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">إجمالي المصروفات</p>
                                <p className="text-2xl font-bold text-red-600">{totalStats.amount.toLocaleString()} ر.س</p>
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
                            placeholder="بحث في المصروفات..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input pr-10 w-full"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>التاريخ</th>
                                    <th>البيان</th>
                                    <th>التصنيف</th>
                                    <th>المبلغ</th>
                                    <th>سجل بواسطة</th>
                                    <th>المورد</th>
                                    <th>المرفقات</th>
                                    <th>قيود</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(expense => (
                                    <tr key={expense.id}>
                                        <td>{new Date(expense.expenseDate).toLocaleDateString('ar-SA')}</td>
                                        <td className="font-medium">{expense.description}</td>
                                        <td>
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                                {expense.category || 'عام'}
                                            </span>
                                        </td>
                                        <td className="font-bold text-red-600">{Number(expense.amount).toLocaleString()} ر.س</td>
                                        <td className="text-sm text-gray-500">{expense.createdBy.nameAr}</td>
                                        <td className="text-sm">{expense.vendor?.nameAr || '-'}</td>
                                        <td>
                                            {expense.imageUrl && (
                                                <button
                                                    onClick={() => {
                                                        if (expense.imageUrl?.endsWith('.pdf')) {
                                                            window.open(expense.imageUrl, '_blank')
                                                        } else {
                                                            setViewImage(expense.imageUrl)
                                                        }
                                                    }}
                                                    className="text-[var(--primary-600)] hover:underline flex items-center gap-1"
                                                >
                                                    <ImageIcon size={16} />
                                                    <span>عرض</span>
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                {expense.syncedToQoyod ? (
                                                    <>
                                                        <span className="flex items-center gap-1 text-green-600 text-sm">
                                                            <CheckCircle2 size={16} />
                                                            <span>تم</span>
                                                        </span>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm('هل تريد حذف هذا المصروف من قيود؟')) return
                                                                try {
                                                                    const res = await fetch('/api/qoyod', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ type: 'delete-expense', id: expense.id })
                                                                    })
                                                                    if (res.ok) {
                                                                        alert('تم حذف المصروف من قيود بنجاح')
                                                                        fetchData()
                                                                    } else {
                                                                        const data = await res.json()
                                                                        alert(data.error || 'فشل الحذف من قيود')
                                                                    }
                                                                } catch { alert('حدث خطأ') }
                                                            }}
                                                            className="p-1 text-red-500 hover:bg-red-50 rounded-md"
                                                            title="حذف من قيود"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch('/api/qoyod', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ type: 'expense', id: expense.id })
                                                                })
                                                                const data = await res.json()
                                                                if (res.ok) {
                                                                    alert('تم مزامنة المصروف مع قيود بنجاح')
                                                                    fetchData()
                                                                } else {
                                                                    alert(data.error || 'فشل المزامنة')
                                                                }
                                                            } catch { alert('حدث خطأ في الاتصال') }
                                                        }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-1"
                                                        title="مزامنة مع قيود"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredExpenses.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <FileText className="text-gray-300 mb-4" size={64} />
                            <p className="text-[var(--text-secondary)]">لا توجد مصروفات</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                            <h3 className="text-lg font-bold">تسجيل مصروف جديد</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-md">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="form-label">المبلغ *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="form-label mb-0">المورد</label>
                                    <button
                                        type="button"
                                        onClick={syncVendors}
                                        disabled={syncingVendors}
                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        {syncingVendors ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                        مزامنة من قيود
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="ابحث عن المورد..."
                                        value={vendorSearch}
                                        onChange={e => {
                                            setVendorSearch(e.target.value)
                                            setShowVendorDropdown(true)
                                        }}
                                        onFocus={() => setShowVendorDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowVendorDropdown(false), 150)}
                                        className="form-input w-full"
                                    />
                                    {showVendorDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {vendors
                                                .filter(v => v.nameAr.toLowerCase().includes(vendorSearch.toLowerCase()))
                                                .map(v => (
                                                    <div
                                                        key={v.id}
                                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                                                        onClick={() => {
                                                            setFormData({ ...formData, vendorId: v.id })
                                                            setVendorSearch(v.nameAr)
                                                            setShowVendorDropdown(false)
                                                        }}
                                                    >
                                                        {v.nameAr}
                                                    </div>
                                                ))}
                                            {vendors.filter(v => v.nameAr.toLowerCase().includes(vendorSearch.toLowerCase())).length === 0 && (
                                                <div className="px-3 py-2 text-gray-500 text-sm">لا توجد نتائج</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="form-label">البيان (الوصف) *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="مثال: شراء أدوات نظافة"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">التاريخ</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.expenseDate}
                                        onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                                        className="form-input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">التصنيف</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="form-input w-full"
                                    >
                                        <option value="">اختر التصنيف</option>
                                        <option value="صيانة">صيانة</option>
                                        <option value="نظافة">نظافة</option>
                                        <option value="ضيافة">ضيافة</option>
                                        <option value="مكتبية">مكتبية</option>
                                        <option value="أخرى">أخرى</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">صورة الفاتورة</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[var(--primary-500)] transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('file-upload')?.click()}>
                                    <div className="space-y-1 text-center">
                                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-[var(--primary-600)] hover:text-[var(--primary-500)] focus-within:outline-none">
                                                <span>رفع ملف</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*,.pdf" onChange={handleFileChange} />
                                            </label>
                                            <p className="pl-1">أو اسحب وأفلت</p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            PNG, JPG, GIF, PDF up to 2MB
                                        </p>
                                        {formData.file && (
                                            <p className="text-sm font-medium text-green-600 mt-2">
                                                تم اختيار الملف: {formData.file.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary"
                                    disabled={saving}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary flex items-center gap-2"
                                    disabled={saving}
                                >
                                    {saving && <Loader2 className="animate-spin" size={16} />}
                                    حفظ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Image Viewer */}
            {viewImage && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setViewImage(null)}>
                    <div className="max-w-4xl max-h-[90vh] relative">
                        <img src={viewImage} alt="Invoice" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
                        <button
                            className="absolute -top-10 right-0 text-white hover:text-gray-300"
                            onClick={() => setViewImage(null)}
                        >
                            <X size={32} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
